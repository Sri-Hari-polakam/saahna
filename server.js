require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');

let stripe, multer;
try {
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    multer = require('multer');
} catch (err) {
    console.error("CRITICAL: Missing dependencies. Please run 'npm install stripe multer'");
}
const app = express();
const PORT = 5000;
const SECRET_KEY = 'SAHNAA_SECRET_GOLD_2026';

// Middleware
app.use(cors());

// --- STRIPE WEBHOOK ---
app.post('/api/webhook', express.raw({type: 'application/json'}), (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event = req.body;
    try {
        if (process.env.STRIPE_WEBHOOK_SECRET) {
            event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
        } else {
            event = JSON.parse(req.body.toString());
        }
    } catch (err) {
        console.error("Webhook Error:", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const customer = JSON.parse(session.metadata.customer || '{}');
        const items = JSON.parse(session.metadata.items || '[]');
        const totalAmount = session.amount_total / 100;

        db.run(`INSERT INTO orders (customerName, phone, email, address, city, country, totalAmount, paymentId, orderId, items, status) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
            [customer.name, customer.phone, customer.email, customer.address, customer.city, customer.country, totalAmount, session.payment_intent, session.id, JSON.stringify(items), 'Paid'],
            function(err) {
                if(err) console.error("DB Insert Error", err);
            });
    }

    res.json({received: true});
});

app.use(express.json());
app.use('/uploads', express.static('uploads'));
app.use(express.static('public')); // Serve frontend

// Ensure uploads directory exists
if (!fs.existsSync('./uploads')) {
    fs.mkdirSync('./uploads');
}

// Multer config moved below

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

    // Admin Table
    db.run(`CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE,
        password TEXT
    )`);

    // Create default admin if not exists
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
    upload = multer({ storage });
}

app.post('/api/upload', verifyAdmin, (req, res, next) => {
    if (!upload) return res.status(500).json({ error: 'Multer not installed' });
    upload.single('image')(req, res, next);
}, (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No image uploaded' });
    const imageUrl = `https://saahna-production.up.railway.app/uploads/${req.file.filename}`;
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
app.post('/api/create-checkout-session', async (req, res) => {
    try {
        const { items, customer } = req.body;
        
        const lineItems = items.map(item => ({
            price_data: {
                currency: 'inr',
                product_data: {
                    name: item.name,
                    images: item.image ? [item.image] : [],
                },
                unit_amount: Math.round(item.price * 100),
            },
            quantity: item.quantity,
        }));

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            success_url: `https://saahna-production.up.railway.app/success.html`,
            cancel_url: `https://saahna-production.up.railway.app/cancel.html`,
            metadata: {
                customer: JSON.stringify(customer),
                items: JSON.stringify(items.map(i => ({ id: i.id, name: i.name, quantity: i.quantity })))
            }
        });

        res.json({ id: session.id, url: session.url });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
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
