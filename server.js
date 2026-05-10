require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');

let multer;
try {
    multer = require('multer');
} catch (err) {
    console.error("CRITICAL: Missing multer. Please run 'npm install multer'");
}

const app = express();
const PORT = process.env.PORT || 5000;
const SECRET_KEY = 'SAHNAA_SECRET_GOLD_2026';

// Middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Request Logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// --- RAZORPAY WEBHOOK ---
app.use(express.json());
app.use('/uploads', express.static('uploads'));
app.use(express.static(__dirname)); // Serve frontend from root directory

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Ensure uploads directory exists
if (!fs.existsSync('./uploads')) {
    fs.mkdirSync('./uploads');
}

// Multer config moved below

// Database Initialization
const dbPath = path.join(__dirname, 'sahnaa_sa.db');
console.log('Initializing database at:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('DATABASE ERROR:', err.message);
    } else {
        console.log('✅ Connected to Sahnaa SA database.');
    }
});

// Global error handling to prevent silent crashes
process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION:', err);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('UNHANDLED REJECTION:', reason);
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

    db.run(`ALTER TABLE products ADD COLUMN colors TEXT`, () => {});
    db.run(`ALTER TABLE products ADD COLUMN customization TEXT`, () => {});
    db.run(`ALTER TABLE products ADD COLUMN policies TEXT`, () => {});

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

    // Homepage Content Table
    db.run(`CREATE TABLE IF NOT EXISTS homepage_content (
        key TEXT PRIMARY KEY,
        value TEXT
    )`);

    // Seed defaults if not present
    const defaults = {
        hero_bg_image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=90&w=2000',
        hero_frame_image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=90&w=900',
        hero_headline: 'The Art of Couture',
        hero_subtext: 'Exquisite tailoring for the discerning individual. Experience the pinnacle of personalised luxury fashion — crafted in Vijayawada, worn worldwide.',
        brand_title: 'Luxury Redefined',
        brand_text: 'Founded in 2019 by Ashitha Yejju, SAAHNA is the embodiment of bespoke elegance. From intricate fabric sourcing to master-grade tailoring, we create a fashion ecosystem that honors your individuality.',
        sig_card1: JSON.stringify({ id:1, name:'Royal Gold Silk Saree', category:'Sarees', price:14000, discountPrice:12500, badge:'NEW', image:'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=85&w=600' }),
        sig_card2: JSON.stringify({ id:4, name:'Elegant Velvet Evening Dress', category:'One-Piece Dress', price:5200, discountPrice:4500, badge:'TRENDING', image:'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=85&w=600' }),
        sig_card3: JSON.stringify({ id:31, name:'Wedding Couture Set', category:'Lehangas', price:95000, discountPrice:85000, badge:'PREMIUM', image:'https://images.unsplash.com/photo-1583391733975-ac581b23cc7f?auto=format&fit=crop&q=85&w=600' }),
        sig_card4: JSON.stringify({ id:5, name:'Designer Silk Frock', category:'Frocks', price:3800, discountPrice:3200, badge:'NEW', image:'https://images.unsplash.com/photo-1622290319146-7b63fd48a609?auto=format&fit=crop&q=85&w=600' })
    };
    const insertStmt = db.prepare(`INSERT OR IGNORE INTO homepage_content (key, value) VALUES (?, ?)`);
    Object.entries(defaults).forEach(([k, v]) => insertStmt.run(k, v));
    insertStmt.finalize();

    // Admin Table
    db.run(`CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE,
        password TEXT
    )`);
    const adminPass = bcrypt.hashSync('admin123', 10);
    db.run(`INSERT OR IGNORE INTO admins (email, password) VALUES (?, ?)`, ['admin@saahna.com', adminPass]);
    // Create default products to reach 200 total
    db.get(`SELECT COUNT(*) as count FROM products`, (err, row) => {
        if (row.count < 200) {
            db.run("DELETE FROM products"); // clear existing to avoid duplicates
            
            const categories = ["Sarees", "Men's Wear", "Co - ord sets", "One - Piece Dress", "Frocks", "Fabrics", "Kurtis", "Lehangas", "Kid's Wear"];
            const templates = [
                { price: 12500, discountPrice: 11000, desc: "Classic Banarasi silk.", image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800", sizes: ["Free Size"] },
                { price: 2500, discountPrice: 2200, desc: "Premium Italian linen.", image: "https://images.unsplash.com/photo-1598033129183-c4f50c7176c8?auto=format&fit=crop&q=80&w=800", sizes: ["S","M","L","XL"] },
                { price: 85000, discountPrice: 80000, desc: "Matching bride & groom outfits.", image: "https://images.unsplash.com/photo-1583391733975-ac581b23cc7f?auto=format&fit=crop&q=80&w=800", sizes: ["Custom"] },
                { price: 4500, discountPrice: 4000, desc: "Elegant velvet dress.", image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=800", sizes: ["S","M","L","XL"] },
                { price: 3200, discountPrice: 2800, desc: "Beautiful designer frock.", image: "https://images.unsplash.com/photo-1622290319146-7b63fd48a609?auto=format&fit=crop&q=80&w=800", sizes: ["S","M","L"] }
            ];
            const adjectives = ["Royal", "Classic", "Premium", "Elegant", "Luxury", "Designer", "Modern", "Traditional", "Festive", "Casual"];
            const colors = ["Gold", "White", "Blue", "Peach", "Midnight", "Emerald", "Ruby", "Silver", "Ivory", "Rose", "Crimson"];

            const stmt = db.prepare(`INSERT INTO products (name, category, price, discountPrice, stock, description, fabric, care, images, sizes) VALUES (?,?,?,?,?,?,?,?,?,?)`);
            for (let i = 1; i <= 200; i++) {
                const category = categories[i % categories.length];
                const t = templates[i % templates.length];
                const adj = adjectives[i % adjectives.length];
                const color = colors[i % colors.length];
                
                const name = `${adj} ${color} ${category.split(" ")[0]} ${i}`;
                
                stmt.run([
                    name, category, t.price + (i * 10), t.discountPrice + (i * 10), 20 + (i % 10),
                    t.desc, "Mixed", "Dry Clean", JSON.stringify([t.image]), JSON.stringify(t.sizes)
                ]);
            }
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

// Multer Config & Upload Route
let upload = null;
if (multer) {
    const storage = multer.diskStorage({
        destination: './uploads/',
        filename: (req, file, cb) => {
            cb(null, 'prod_' + Date.now() + path.extname(file.originalname));
        }
    });
    upload = multer({
        storage,
        fileFilter: (req, file, cb) => {
            // Accept images and videos
            if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
                cb(null, true);
            } else {
                cb(new Error('Only image and video files are allowed'));
            }
        },
        limits: { fileSize: 100 * 1024 * 1024 } // 100MB max for videos
    });
}

app.post('/api/upload', verifyAdmin, (req, res, next) => {
    if (!upload) return res.status(500).json({ error: 'Multer not installed' });
    upload.single('image')(req, res, next);
}, (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No image uploaded' });
    // Use the current host instead of hardcoded localhost
    const protocol = req.protocol;
    const host = req.get('host');
    const imageUrl = `${protocol}://${host}/uploads/${req.file.filename}`;
    res.json({ imageUrl });
});

// --- PRODUCT ROUTES ---
app.get('/api/products', (req, res) => {
    db.all(`SELECT * FROM products`, [], (err, rows) => {
        res.json(rows.map(r => ({ 
            ...r, 
            images: JSON.parse(r.images || '[]'), 
            sizes: JSON.parse(r.sizes || '[]'),
            colors: JSON.parse(r.colors || '[]'),
            customization: JSON.parse(r.customization || '{}'),
            policies: JSON.parse(r.policies || '{}')
        })));
    });
});

app.post('/api/products', verifyAdmin, (req, res) => {
    const { name, category, price, discountPrice, stock, description, fabric, care, images, sizes, colors, customization, policies } = req.body;
    db.run(`INSERT INTO products (name, category, price, discountPrice, stock, description, fabric, care, images, sizes, colors, customization, policies) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [name, category, price, discountPrice, stock, description, fabric, care, JSON.stringify(images), JSON.stringify(sizes), JSON.stringify(colors || []), JSON.stringify(customization || {}), JSON.stringify(policies || {})],
        function(err) {
            res.json({ id: this.lastID });
        });
});

app.delete('/api/products/:id', verifyAdmin, (req, res) => {
    db.run(`DELETE FROM products WHERE id = ?`, [req.params.id], () => res.json({ success: true }));
});

app.put('/api/products/:id', verifyAdmin, (req, res) => {
    const { name, category, price, discountPrice, stock, description, fabric, care, images, sizes, colors, customization, policies } = req.body;
    db.run(`UPDATE products SET name=?, category=?, price=?, discountPrice=?, stock=?, description=?, fabric=?, care=?, images=?, sizes=?, colors=?, customization=?, policies=? WHERE id=?`,
        [name, category, price, discountPrice, stock, description, fabric, care, JSON.stringify(images), JSON.stringify(sizes), JSON.stringify(colors || []), JSON.stringify(customization || {}), JSON.stringify(policies || {}), req.params.id],
        function(err) {
            if(err) return res.status(500).json({error: err.message});
            res.json({ success: true });
        });
});

// --- HOMEPAGE CONTENT ROUTES ---
app.get('/api/homepage', (req, res) => {
    db.all(`SELECT key, value FROM homepage_content`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const content = {};
        rows.forEach(r => {
            try { content[r.key] = JSON.parse(r.value); } catch { content[r.key] = r.value; }
        });
        res.json(content);
    });
});

app.put('/api/homepage', verifyAdmin, (req, res) => {
    const updates = req.body; // { key: value, ... }
    const stmt = db.prepare(`INSERT OR REPLACE INTO homepage_content (key, value) VALUES (?, ?)`);
    Object.entries(updates).forEach(([k, v]) => {
        stmt.run(k, typeof v === 'object' ? JSON.stringify(v) : String(v));
    });
    stmt.finalize(err => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
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
app.post('/api/orders', (req, res) => {
    const { items, customer, paymentMethod, totalAmount } = req.body;
    const status = paymentMethod === 'cod' ? 'Pending (COD)' : 'Pending';
    const orderId = 'ORD_' + Date.now();
    
    db.run(`INSERT INTO orders (customerName, phone, email, address, city, country, totalAmount, paymentId, orderId, items, status) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
        [customer.name, customer.phone, customer.email, customer.address, customer.city, customer.country, totalAmount, paymentMethod, orderId, JSON.stringify(items), status],
        function(err) {
            if(err) return res.status(500).json({ error: err.message });
            res.json({ success: true, orderId: orderId });
        });
});

app.get('/api/orders', verifyAdmin, (req, res) => {
    db.all(`SELECT * FROM orders ORDER BY createdAt DESC`, [], (err, rows) => res.json(rows));
});

app.put('/api/orders/:id', verifyAdmin, (req, res) => {
    const { status } = req.body;
    db.run(`UPDATE orders SET status = ? WHERE id = ?`, [status, req.params.id], function(err) {
        if(err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
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

// Health check route for Railway
app.get('/api/health', (req, res) => res.json({ status: 'healthy', timestamp: new Date() }));

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server fully operational on port ${PORT}`);
    console.log(`🌍 Production URL: https://saahna-production.up.railway.app`);
});
