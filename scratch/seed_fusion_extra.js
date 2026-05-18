const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'sahnaa_sa.db');
const db = new sqlite3.Database(dbPath);

const newProducts = [
    {
        name: 'Emerald Velvet Kaftan',
        category: 'Fusion Ware',
        price: 13000,
        discountPrice: 10500,
        stock: 6,
        description: 'Luxurious emerald velvet kaftan with metallic silver threadwork and beaded tassels. Perfect for evening soirees.',
        fabric: 'Silk Velvet',
        care: 'Dry clean only',
        images: JSON.stringify(['https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=800']),
        sizes: JSON.stringify(['Free Size']),
        colors: JSON.stringify(['Emerald Green']),
        customization: JSON.stringify({ note: 'Adjustable waist tie included.' }),
        policies: JSON.stringify({ note: 'Standard returns apply.' })
    },
    {
        name: 'Peplum & Dhoti Co-ord',
        category: 'Fusion Ware',
        price: 8500,
        discountPrice: 6500,
        stock: 10,
        description: 'Modern peplum top paired with traditional draped dhoti pants in a pastel peach palette.',
        fabric: 'Crepe Silk',
        care: 'Gentle hand wash',
        images: JSON.stringify(['https://images.unsplash.com/photo-1583391733975-ac581b23cc7f?auto=format&fit=crop&q=80&w=800']),
        sizes: JSON.stringify(['S', 'M', 'L']),
        colors: JSON.stringify(['Peach', 'Mint']),
        customization: JSON.stringify({ note: 'Sleeve addition available.' }),
        policies: JSON.stringify({ note: 'Exchange only.' })
    },
    {
        name: 'Sequinned Fusion Sari-Gown',
        category: 'Fusion Ware',
        price: 18000,
        discountPrice: 15500,
        stock: 4,
        description: 'The elegance of a saree meets the ease of a gown. Pre-draped with all-over sequins for a dazzling look.',
        fabric: 'Georgette & Sequins',
        care: 'Dry clean only',
        images: JSON.stringify(['https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800']),
        sizes: JSON.stringify(['S', 'M', 'L', 'XL']),
        colors: JSON.stringify(['Midnight Black', 'Silver']),
        customization: JSON.stringify({ note: 'Custom length available.' }),
        policies: JSON.stringify({ note: 'Non-returnable.' })
    },
    {
        name: 'Zardosi Work Crop Top & Culottes',
        category: 'Fusion Ware',
        price: 9000,
        discountPrice: 7200,
        stock: 15,
        description: 'Intricate zardosi embroidery on a raw silk crop top, paired with modern high-waisted culottes.',
        fabric: 'Raw Silk',
        care: 'Dry clean only',
        images: JSON.stringify(['https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=800']),
        sizes: JSON.stringify(['XS', 'S', 'M']),
        colors: JSON.stringify(['Ivory', 'Gold']),
        customization: JSON.stringify({ note: 'Available in custom waist sizes.' }),
        policies: JSON.stringify({ note: 'Standard returns.' })
    }
];

db.serialize(() => {
    const stmt = db.prepare(`INSERT INTO products (name, category, price, discountPrice, stock, description, fabric, care, images, sizes, colors, customization, policies) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`);
    
    newProducts.forEach(p => {
        stmt.run(p.name, p.category, p.price, p.discountPrice, p.stock, p.description, p.fabric, p.care, p.images, p.sizes, p.colors, p.customization, p.policies);
    });
    
    stmt.finalize();
    console.log('✅ 4 New Fusion Ware products added successfully.');
});

db.close();
