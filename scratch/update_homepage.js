const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'sahnaa_sa.db');
const db = new sqlite3.Database(dbPath);

const updates = {
    sig_card2: JSON.stringify({ 
        id: 2, 
        name: 'Magenta Silk Saree', 
        category: 'Sarees', 
        price: 12500, 
        discountPrice: 9500, 
        badge: 'TRENDING', 
        image: 'uploads/prod_1778432770197.png', 
        stock: 10 
    }),
    sig_card4: JSON.stringify({ 
        id: 4, 
        name: 'Emerald Designer Suit', 
        category: 'Kid\'s Wear', 
        price: 8500, 
        discountPrice: 6500, 
        badge: 'PREMIUM', 
        image: 'uploads/grenn ai.png', 
        stock: 10 
    })
};

db.serialize(() => {
    const stmt = db.prepare(`INSERT OR REPLACE INTO homepage_content (key, value) VALUES (?, ?)`);
    Object.entries(updates).forEach(([k, v]) => {
        stmt.run(k, v);
        console.log(`Updated ${k}`);
    });
    stmt.finalize();
});

db.close((err) => {
    if (err) {
        console.error('Error closing database:', err.message);
    } else {
        console.log('Database updated successfully.');
    }
});
