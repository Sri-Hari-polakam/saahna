const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'sahnaa_sa.db');
const db = new sqlite3.Database(dbPath);

const products = [
    {
        name: 'Regal Fusion Velvet Gown',
        category: 'Fusion Ware',
        price: 14500,
        discountPrice: 12000,
        stock: 5,
        description: 'A perfect blend of traditional velvet craftsmanship and modern silhouette. Features a structured bodice and a cascading silk drape.',
        fabric: 'Premium Velvet & Silk',
        care: 'Professional Dry Clean Only',
        images: JSON.stringify(['https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=800']),
        sizes: JSON.stringify(['S', 'M', 'L', 'XL']),
        colors: JSON.stringify(['Deep Burgundy', 'Midnight Blue']),
        customization: 'Available for size and sleeve length.',
        policies: 'Non-returnable as it is a custom fusion piece.'
    },
    {
        name: 'Indigo Draped Fusion Set',
        category: 'Fusion Ware',
        price: 11000,
        discountPrice: 8500,
        stock: 8,
        description: 'Contemporary draped styling meets ethnic indigo prints. This set includes a high-low tunic and tailored dhoti-style pants.',
        fabric: 'Organic Cotton & Rayon',
        care: 'Hand wash cold separately',
        images: JSON.stringify(['https://images.unsplash.com/photo-1583391733975-ac581b23cc7f?auto=format&fit=crop&q=80&w=800']),
        sizes: JSON.stringify(['XS', 'S', 'M', 'L']),
        colors: JSON.stringify(['Indigo Blue', 'Dusty Rose']),
        customization: 'Tunic length can be adjusted.',
        policies: '7-day replacement for size issues.'
    },
    {
        name: 'Gold Embroidered Fusion Cape',
        category: 'Fusion Ware',
        price: 9500,
        discountPrice: 7500,
        stock: 12,
        description: 'Ethereal fusion cape with intricate zardosi embroidery. Can be paired with both western gowns and traditional lehengas.',
        fabric: 'Fine Net with Zardosi Work',
        care: 'Dry clean only',
        images: JSON.stringify(['https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800']),
        sizes: JSON.stringify(['Free Size']),
        colors: JSON.stringify(['Champagne Gold', 'Silver Sparkle']),
        customization: 'Available in custom colors on request.',
        policies: 'Final sale item.'
    }
];

db.serialize(() => {
    const stmt = db.prepare(`INSERT INTO products (name, category, price, discountPrice, stock, description, fabric, care, images, sizes, colors, customization, policies) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    
    products.forEach(p => {
        stmt.run(p.name, p.category, p.price, p.discountPrice, p.stock, p.description, p.fabric, p.care, p.images, p.sizes, p.colors, p.customization, p.policies);
    });
    
    stmt.finalize();
    console.log('✅ Fusion Ware products added successfully.');
});

db.close();
