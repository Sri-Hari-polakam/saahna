const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Razorpay = require('razorpay');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 5000;
const SECRET_KEY = 'SAHNAA_SECRET_GOLD_2026';

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));
app.use(express.static('public')); // Serve frontend

// Ensure uploads directory exists
if (!fs.existsSync('./uploads')) {
    fs.mkdirSync('./uploads');
}

// Database Initialization
const db = new sqlite3.Database('./sahnaa_sa.db', (err) => {
    if (err) console.error(err.message);
    console.log('Connected to Sahnaa SA database.');
});

db.serialize(() => {
    // Products Table
    db.run(`CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        category TEXT,
        price REAL,
        discountPrice REAL,
        stock INTEGER,
        description TEXT,
        fabric TEXT,
        care TEXT,
        images TEXT,
        sizes TEXT
    )`);

    // Orders Table
    db.run(`CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customerName TEXT,
        phone TEXT,
        email TEXT,
        address TEXT,
        city TEXT,
        country TEXT,
        totalAmount REAL,
        status TEXT DEFAULT 'Pending',
        paymentId TEXT,
        orderId TEXT,
        items TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Enquiries & Custom Orders Table
    db.run(`CREATE TABLE IF NOT EXISTS enquiries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT, -- 'General' or 'Custom'
        name TEXT,
        email TEXT,
        phone TEXT,
        message TEXT,
        details TEXT, -- For custom orders (size, quantity etc)
        image TEXT,
        status TEXT DEFAULT 'New',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Admin Table
    db.run(`CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE,
        password TEXT
    )`);

    // Create default admin if not exists
    const adminPass = bcrypt.hashSync('admin123', 10);
    db.run(`INSERT OR IGNORE INTO admins (email, password) VALUES (?, ?)`, ['admin@saahna.com', adminPass]);
    // Create default products if empty
    db.get(`SELECT COUNT(*) as count FROM products`, (err, row) => {
        if (row.count === 0) {
            const initialProducts = [
                // SAREES
                ["Royal Gold Banarasi", "Sarees", 12500, 11000, 15, "Classic Banarasi silk.", "Silk", "Dry Clean", '["https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800"]', '["Free Size"]'],
                ["Ivory Kanjivaram", "Sarees", 15000, 14000, 10, "Pure Kanjivaram silk.", "Silk", "Dry Clean", '["https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&q=80&w=800"]', '["Free Size"]'],
                ["Champagne Chiffon", "Sarees", 8500, 7500, 20, "Lightweight chiffon.", "Chiffon", "Dry Clean", '["https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&q=80&w=800"]', '["Free Size"]'],
                ["Gold Brocade Saree", "Sarees", 18000, 16000, 12, "Intricate brocade work.", "Silk", "Dry Clean", '["https://images.unsplash.com/photo-1610030469668-935142b96de4?auto=format&fit=crop&q=80&w=800"]', '["Free Size"]'],
                ["Midnight Silk Saree", "Sarees", 11000, 10000, 8, "Deep navy silk.", "Silk", "Dry Clean", '["https://images.unsplash.com/photo-1610189012906-407883984605?auto=format&fit=crop&q=80&w=800"]', '["Free Size"]'],
                ["Rose Gold Organza", "Sarees", 9500, 8500, 15, "Elegant organza.", "Organza", "Dry Clean", '["https://images.unsplash.com/photo-1610030469915-05562725c363?auto=format&fit=crop&q=80&w=800"]', '["Free Size"]'],
                ["Classic Red Pattu", "Sarees", 22000, 20000, 5, "Wedding pattu saree.", "Silk", "Dry Clean", '["https://images.unsplash.com/photo-1583391733975-ac581b23cc7f?auto=format&fit=crop&q=80&w=800"]', '["Free Size"]'],
                ["Emerald Green Silk", "Sarees", 13500, 12000, 10, "Rich green silk.", "Silk", "Dry Clean", '["https://images.unsplash.com/photo-1610030469931-18e388065b79?auto=format&fit=crop&q=80&w=800"]', '["Free Size"]'],
                ["Beige Handloom", "Sarees", 7200, 6500, 18, "Handloom silk cotton.", "Silk Cotton", "Dry Clean", '["https://images.unsplash.com/photo-1610030470220-4f51e06e3001?auto=format&fit=crop&q=80&w=800"]', '["Free Size"]'],
                ["Golden Tissue Saree", "Sarees", 16500, 15000, 6, "Ultra-fine tissue silk.", "Silk", "Dry Clean", '["https://images.unsplash.com/photo-1610030470241-d61f74f469bb?auto=format&fit=crop&q=80&w=800"]', '["Free Size"]'],
                
                // SHIRTS
                ["Linen White Shirt", "Men's Wear", 2500, 2200, 30, "Premium Italian linen.", "Linen", "Machine Wash", '["https://images.unsplash.com/photo-1598033129183-c4f50c7176c8?auto=format&fit=crop&q=80&w=800"]', '["S","M","L","XL"]'],
                ["Gold Silk Kurta", "Men's Wear", 5500, 5000, 25, "Luxury silk kurta.", "Silk", "Hand Wash", '["https://images.unsplash.com/photo-1597983073493-88cd35cf93b0?auto=format&fit=crop&q=80&w=800"]', '["S","M","L","XL"]'],
                ["Beige Bandhgala", "Men's Wear", 12000, 11000, 10, "Classic Bandhgala set.", "Wool", "Dry Clean", '["https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&q=80&w=800"]', '["M","L","XL"]'],
                ["Navy Formal Shirt", "Men's Wear", 3200, 2800, 40, "Formal cotton shirt.", "Cotton", "Machine Wash", '["https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=800"]', '["S","M","L","XL"]'],
                ["Embroidered Sherwani", "Men's Wear", 25000, 22000, 5, "Intricate embroidery sherwani.", "Silk", "Dry Clean", '["https://images.unsplash.com/photo-1598505231683-194139956461?auto=format&fit=crop&q=80&w=800"]', '["M","L","XL"]'],
                ["Sky Blue Linen", "Men's Wear", 2800, 2500, 20, "Casual linen shirt.", "Linen", "Machine Wash", '["https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&q=80&w=800"]', '["S","M","L","XL"]'],
                ["Classic Black Kurta", "Men's Wear", 4200, 3800, 15, "Black cotton silk kurta.", "Silk Cotton", "Hand Wash", '["https://images.unsplash.com/photo-1611082531024-5d5138127339?auto=format&fit=crop&q=80&w=800"]', '["M","L","XL"]'],
                ["Peach Wedding Kurta", "Men's Wear", 6800, 6000, 10, "Peach silk mirror work.", "Silk", "Dry Clean", '["https://images.unsplash.com/photo-1597983073280-9907f1857997?auto=format&fit=crop&q=80&w=800"]', '["S","M","L","XL"]'],
                ["Tan Leather Loafers", "Men's Wear", 4500, 4000, 12, "Handcrafted loafers.", "Leather", "Polish", '["https://images.unsplash.com/photo-1533867617858-e7b97e060509?auto=format&fit=crop&q=80&w=800"]', '["8","9","10","11"]'],
                ["Velvet Waistcoat", "Men's Wear", 3800, 3500, 20, "Maroon velvet waistcoat.", "Velvet", "Dry Clean", '["https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&q=80&w=800"]', '["S","M","L"]'],
                
                // COMBOS (Matching Couple Wear)
                ["Royal Couple Combo", "Co - ord sets", 85000, 80000, 5, "Matching bride & groom outfits.", "Silk", "Dry Clean", '["https://images.unsplash.com/photo-1583391733975-ac581b23cc7f?auto=format&fit=crop&q=80&w=800"]', '["Custom"]'],
                ["Ethnic Duo Set", "Co - ord sets", 42000, 38000, 8, "Matching ivory sets.", "Silk", "Dry Clean", '["https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&q=80&w=800"]', '["Custom"]'],
                ["Sangeet Sparkle Combo", "Co - ord sets", 55000, 50000, 6, "Mirror work couple sets.", "Silk", "Dry Clean", '["https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=800"]', '["Custom"]'],
                ["Pastel Promise Set", "Co - ord sets", 68000, 62000, 4, "Matching pastel couture.", "Silk", "Dry Clean", '["https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&q=80&w=800"]', '["Custom"]'],
                ["Midnight Couple Wear", "Co - ord sets", 48000, 45000, 7, "Navy silk duo set.", "Silk", "Dry Clean", '["https://images.unsplash.com/photo-1529636798458-92182e662485?auto=format&fit=crop&q=80&w=800"]', '["Custom"]'],
                ["Golden Aura Combo", "Co - ord sets", 92000, 88000, 3, "Luxury golden couple wear.", "Silk", "Dry Clean", '["https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&q=80&w=800"]', '["Custom"]'],
                ["Floral Fusion Duo", "Co - ord sets", 35000, 32000, 10, "Modern floral couple set.", "Cotton Silk", "Dry Clean", '["https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=800"]', '["Custom"]'],
                ["Velvet Royalty Set", "Co - ord sets", 78000, 72000, 4, "Maroon velvet duo.", "Velvet", "Dry Clean", '["https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&q=80&w=800"]', '["Custom"]'],
                ["Silk Symphony Combo", "Co - ord sets", 41000, 38000, 9, "Traditional silk duo.", "Silk", "Dry Clean", '["https://images.unsplash.com/photo-1529636798458-92182e662485?auto=format&fit=crop&q=80&w=800"]', '["Custom"]'],
                ["Luxury Brocade Duo", "Co - ord sets", 82000, 78000, 2, "Heavy brocade couple set.", "Silk", "Dry Clean", '["https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&q=80&w=800"]', '["Custom"]'],
                
                // ONE-PIECE DRESSES
                ["Midnight Blue Velvet Dress", "One - Piece Dress", 4500, 4000, 15, "Elegant midnight blue velvet dress.", "Velvet", "Dry Clean", '["https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=800"]', '["S","M","L","XL"]'],
                ["Rose Silk Maxi", "One - Piece Dress", 5500, 5000, 10, "Flowy rose-colored silk maxi dress.", "Silk", "Dry Clean", '["https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&q=80&w=800"]', '["S","M","L"]'],
                ["Emerald Green Satin Dress", "One - Piece Dress", 4800, 4500, 12, "Sleek emerald green satin slip dress.", "Satin", "Dry Clean", '["https://images.unsplash.com/photo-1612336307429-8a898d10e223?auto=format&fit=crop&q=80&w=800"]', '["S","M","L"]'],
                ["Classic Black Wrap Dress", "One - Piece Dress", 3500, 3200, 20, "Versatile black wrap dress.", "Cotton Blend", "Machine Wash", '["https://images.unsplash.com/photo-1605763240000-7e93b172d754?auto=format&fit=crop&q=80&w=800"]', '["S","M","L","XL"]'],
                ["Floral Chiffon Midi", "One - Piece Dress", 3200, 2800, 18, "Lightweight chiffon midi dress.", "Chiffon", "Dry Clean", '["https://images.unsplash.com/photo-1572804013427-4d7ca7268217?auto=format&fit=crop&q=80&w=800"]', '["M","L","XL"]'],
                ["White Lace Shift Dress", "One - Piece Dress", 4200, 3800, 15, "Delicate white lace dress.", "Lace", "Dry Clean", '["https://images.unsplash.com/photo-1515347619362-e6bf7f94086e?auto=format&fit=crop&q=80&w=800"]', '["S","M","L"]'],
                ["Burgundy Sequin Gown", "One - Piece Dress", 8500, 8000, 8, "Glamorous burgundy sequin evening gown.", "Sequin", "Dry Clean", '["https://images.unsplash.com/photo-1566160980482-ebc2669e2c6d?auto=format&fit=crop&q=80&w=800"]', '["S","M","L","XL"]'],
                ["Mustard Yellow Sundress", "One - Piece Dress", 2800, 2500, 25, "Bright mustard yellow cotton sundress.", "Cotton", "Machine Wash", '["https://images.unsplash.com/photo-1596783049102-1811eef2deaf?auto=format&fit=crop&q=80&w=800"]', '["S","M","L"]'],
                ["Navy Blue A-Line Dress", "One - Piece Dress", 3900, 3500, 14, "Structured navy blue A-line dress.", "Cotton Blend", "Machine Wash", '["https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=800"]', '["M","L","XL"]'],
                ["Silver Pleated Maxi", "One - Piece Dress", 6200, 5800, 6, "Stunning silver pleated metallic maxi.", "Polyester", "Dry Clean", '["https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&q=80&w=800"]', '["S","M","L"]'],
                
                // FROCKS
                ["Peach Floral Frock", "Frocks", 3200, 2800, 20, "Beautiful peach floral designer frock.", "Cotton", "Machine Wash", '["https://images.unsplash.com/photo-1622290319146-7b63fd48a609?auto=format&fit=crop&q=80&w=800"]', '["S","M","L"]'],
                ["Blue Silk Frock", "Frocks", 4500, 4000, 15, "Elegant blue silk party frock.", "Silk", "Dry Clean", '["https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=800"]', '["S","M","L"]']
            ];
            const stmt = db.prepare(`INSERT INTO products (name, category, price, discountPrice, stock, description, fabric, care, images, sizes) VALUES (?,?,?,?,?,?,?,?,?,?)`);
            initialProducts.forEach(p => stmt.run(p));
            stmt.finalize();
        }
    });
});

// --- AUTH ROUTES ---
app.post('/api/admin/login', (req, res) => {
    const { email, password } = req.body;
    db.get(`SELECT * FROM admins WHERE email = ?`, [email], (err, admin) => {
        if (err || !admin) return res.status(400).json({ error: 'Admin not found' });
        const valid = bcrypt.compareSync(password, admin.password);
        if (!valid) return res.status(401).json({ error: 'Invalid password' });
        const token = jwt.sign({ id: admin.id, email: admin.email }, SECRET_KEY);
        res.json({ token, admin: { email: admin.email } });
    });
});

// Middleware to verify token
const verifyAdmin = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).json({ error: 'No token provided' });
    jwt.verify(token.split(' ')[1], SECRET_KEY, (err, decoded) => {
        if (err) return res.status(401).json({ error: 'Unauthorized' });
        req.admin = decoded;
        next();
    });
};

// --- PRODUCT ROUTES ---
app.get('/api/products', (req, res) => {
    db.all(`SELECT * FROM products`, [], (err, rows) => {
        res.json(rows.map(r => ({ ...r, images: JSON.parse(r.images || '[]'), sizes: JSON.parse(r.sizes || '[]') })));
    });
});

app.post('/api/products', verifyAdmin, (req, res) => {
    const { name, category, price, discountPrice, stock, description, fabric, care, images, sizes } = req.body;
    db.run(`INSERT INTO products (name, category, price, discountPrice, stock, description, fabric, care, images, sizes) VALUES (?,?,?,?,?,?,?,?,?,?)`,
        [name, category, price, discountPrice, stock, description, fabric, care, JSON.stringify(images), JSON.stringify(sizes)],
        function(err) {
            res.json({ id: this.lastID });
        });
});

app.delete('/api/products/:id', verifyAdmin, (req, res) => {
    db.run(`DELETE FROM products WHERE id = ?`, [req.params.id], () => res.json({ success: true }));
});

// --- ENQUIRY ROUTES ---
app.post('/api/enquiry', (req, res) => {
    const { type, name, email, phone, message, details, image } = req.body;
    db.run(`INSERT INTO enquiries (type, name, email, phone, message, details, image) VALUES (?,?,?,?,?,?,?)`,
        [type, name, email, phone, message, JSON.stringify(details), image],
        function(err) {
            res.json({ success: true, id: this.lastID });
        });
});

app.get('/api/enquiries', verifyAdmin, (req, res) => {
    db.all(`SELECT * FROM enquiries ORDER BY createdAt DESC`, [], (err, rows) => res.json(rows));
});

// --- ORDER & PAYMENT ROUTES ---
const razorpay = new Razorpay({
    key_id: 'rzp_test_placeholder', // Should be in .env
    key_secret: 'rzp_test_placeholder_secret'
});

app.post('/api/create-order', async (req, res) => {
    const { amount } = req.body;
    try {
        const order = await razorpay.orders.create({
            amount: amount * 100, // paisa
            currency: 'INR',
            receipt: 'order_' + Date.now()
        });
        res.json(order);
    } catch (err) {
        res.status(500).json(err);
    }
});

app.post('/api/confirm-payment', (req, res) => {
    const { customer, items, totalAmount, paymentId, orderId } = req.body;
    db.run(`INSERT INTO orders (customerName, phone, email, address, city, country, totalAmount, paymentId, orderId, items) VALUES (?,?,?,?,?,?,?,?,?,?)`,
        [customer.name, customer.phone, customer.email, customer.address, customer.city, customer.country, totalAmount, paymentId, orderId, JSON.stringify(items)],
        function(err) {
            res.json({ success: true, orderId: this.lastID });
        });
});

app.get('/api/orders', verifyAdmin, (req, res) => {
    db.all(`SELECT * FROM orders ORDER BY createdAt DESC`, [], (err, rows) => res.json(rows));
});

app.get('/api/stats', verifyAdmin, (req, res) => {
    const stats = {};
    db.get(`SELECT COUNT(*) as count, SUM(totalAmount) as revenue FROM orders`, (err, row) => {
        stats.totalOrders = row.count;
        stats.revenue = row.revenue || 0;
        db.get(`SELECT COUNT(*) as count FROM products`, (err, row) => {
            stats.totalProducts = row.count;
            db.get(`SELECT COUNT(*) as count FROM enquiries`, (err, row) => {
                stats.totalEnquiries = row.count;
                res.json(stats);
            });
        });
    });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
