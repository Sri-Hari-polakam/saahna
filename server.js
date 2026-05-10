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

// START LISTENING IMMEDIATELY (Crucial for Railway to prevent timeouts)
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server listening on port ${PORT}`);
    console.log(`🌍 URL: https://saahna-production.up.railway.app`);
});

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

// Health check route for Railway (Respond fast!)
app.get('/api/health', (req, res) => res.json({ status: 'healthy', timestamp: new Date() }));
app.get('/api', (req, res) => res.json({ message: 'SAAHNA API is running' }));

// --- RAZORPAY WEBHOOK ---
app.use(express.json());
app.use('/uploads', express.static('uploads'));
app.use(express.static(__dirname)); // Serve frontend from root directory

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Database Initialization with extreme error trapping
const dbPath = path.join(__dirname, 'sahnaa_sa.db');
console.log('📦 Database path:', dbPath);

let db;
try {
    db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
        if (err) {
            console.error('❌ DATABASE CONNECTION ERROR:', err.message);
        } else {
            console.log('✅ Database connected successfully.');
            initializeTables();
        }
    });
} catch (e) {
    console.error('❌ CRITICAL DB INIT FAILURE:', e);
}

function initializeTables() {
    db.serialize(() => {
        console.log('🔨 Setting up tables...');
        try {
            db.run(`CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT, category TEXT, price REAL, discountPrice REAL, stock INTEGER,
                description TEXT, fabric TEXT, care TEXT, images TEXT, sizes TEXT,
                colors TEXT, customization TEXT, policies TEXT
            )`);

            db.run(`CREATE TABLE IF NOT EXISTS orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                customerName TEXT, phone TEXT, email TEXT, address TEXT, city TEXT, country TEXT,
                totalAmount REAL, status TEXT DEFAULT 'Pending', paymentId TEXT, orderId TEXT,
                items TEXT, createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);

            db.run(`CREATE TABLE IF NOT EXISTS enquiries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                type TEXT, name TEXT, email TEXT, phone TEXT, message TEXT,
                details TEXT, image TEXT, status TEXT DEFAULT 'New',
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);

            db.run(`CREATE TABLE IF NOT EXISTS homepage_content (key TEXT PRIMARY KEY, value TEXT)`);
            
            // Seed defaults silently
            const defaults = {
                hero_bg_image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=90&w=2000',
                hero_frame_image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=90&w=900',
                hero_headline: 'The Art of Couture',
                hero_subtext: 'Exquisite tailoring for the discerning individual.',
                brand_title: 'Luxury Redefined'
            };
            const insertStmt = db.prepare(`INSERT OR IGNORE INTO homepage_content (key, value) VALUES (?, ?)`);
            Object.entries(defaults).forEach(([k, v]) => insertStmt.run(k, v));
            insertStmt.finalize();

            // Admin default
            const adminPass = bcrypt.hashSync('admin123', 10);
            db.run(`INSERT OR IGNORE INTO admins (email, password) VALUES (?, ?)`, ['admin@saahna.com', adminPass]);

            console.log('✅ Tables initialized.');
        } catch (tableErr) {
            console.error('❌ TABLE SETUP ERROR:', tableErr);
        }
    });
}

// Global error handling to prevent silent crashes
process.on('uncaughtException', (err) => {
    console.error('🔥 UNCAUGHT EXCEPTION:', err.message);
    console.error(err.stack);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('🔥 UNHANDLED REJECTION:', reason);
});
// --- ADMIN AUTH ---
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

// Health check route for Railway is now at the top.
