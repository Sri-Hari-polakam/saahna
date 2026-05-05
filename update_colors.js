const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./sahnaa_sa.db');

const colorPresets = [
    { name: "Crimson Red", hex: "#DC143C" },
    { name: "Midnight Blue", hex: "#191970" },
    { name: "Emerald Green", hex: "#50C878" },
    { name: "Rose Gold", hex: "#B76E79" },
    { name: "Classic Black", hex: "#000000" }
];

db.serialize(() => {
    db.all(`SELECT id, colors, images FROM products`, [], (err, rows) => {
        if (err) {
            console.error("Error reading products:", err);
            return;
        }

        let updatedCount = 0;
        const stmt = db.prepare(`UPDATE products SET colors = ? WHERE id = ?`);
        
        rows.forEach(row => {
            let parsedColors = [];
            try {
                parsedColors = JSON.parse(row.colors || "[]");
            } catch(e) {}
            
            let images = [];
            try {
                images = JSON.parse(row.images || "[]");
            } catch(e) {}
            
            const firstImg = images.length > 0 ? images[0] : "https://via.placeholder.com/800";
            
            if (parsedColors.length === 0) {
                // Assign 3 random colors
                const shuffled = [...colorPresets].sort(() => 0.5 - Math.random());
                const selectedColors = shuffled.slice(0, 3).map((c, index) => {
                    return {
                        name: c.name,
                        hex: c.hex,
                        image: index === 0 ? firstImg : "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=800"
                    };
                });
                
                stmt.run(JSON.stringify(selectedColors), row.id);
                updatedCount++;
            }
        });
        
        stmt.finalize(() => {
            console.log(`Updated ${updatedCount} products with default colors.`);
            db.close();
        });
    });
});
