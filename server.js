require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const Razorpay = require('razorpay');

let multer;
try {
    multer = require('multer');
} catch (err) {
    console.error("CRITICAL: Missing multer. Please run 'npm install multer'");
}

const app = express();
const PORT = process.env.PORT || 5000;
const SECRET_KEY = 'SAHNAA_SECRET_GOLD_2026';

// Razorpay Instance
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Nodemailer Transporter
const transporter = nodemailer.createTransport({
    service: 'gmail', // Or use SMTP settings
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Helper function to send email
const sendEmail = async (to, subject, html) => {
    try {
        await transporter.sendMail({
            from: `"SAAHNA Luxury" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html
        });
        console.log('✅ Email sent successfully to:', to);
    } catch (err) {
        console.error('❌ Email failed:', err.message);
    }
};

// Health check MUST be at the top
app.get('/api/health', (req, res) => res.json({ status: 'healthy', timestamp: new Date() }));
app.get('/', (req, res) => res.json({ message: 'SAAHNA Server is Online' }));

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 SAAHNA backend is LIVE on port ${PORT}`);
});

// Railway/Proxy Stability Tweaks
server.keepAliveTimeout = 120000;
server.headersTimeout = 125000;

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

app.get('/api/admin/seed-fusion', (req, res) => {
    const fusionProducts = [
        {
            name: 'Regal Fusion Velvet Gown',
            category: 'Fusion Ware',
            price: 14500,
            discountPrice: 12000,
            stock: 5,
            description: 'A perfect blend of traditional velvet craftsmanship and modern silhouette.',
            fabric: 'Premium Velvet & Silk',
            care: 'Professional Dry Clean Only',
            images: JSON.stringify(['https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=800']),
            sizes: JSON.stringify(['S', 'M', 'L', 'XL']),
            colors: JSON.stringify(['Deep Burgundy', 'Midnight Blue']),
            customization: JSON.stringify({ note: 'Available for size and sleeve length.' }),
            policies: JSON.stringify({ note: 'Non-returnable as it is a custom fusion piece.' })
        },
        {
            name: 'Indigo Draped Fusion Set',
            category: 'Fusion Ware',
            price: 11000,
            discountPrice: 8500,
            stock: 8,
            description: 'Contemporary draped styling meets ethnic indigo prints.',
            fabric: 'Organic Cotton & Rayon',
            care: 'Hand wash cold separately',
            images: JSON.stringify(['https://images.unsplash.com/photo-1583391733975-ac581b23cc7f?auto=format&fit=crop&q=80&w=800']),
            sizes: JSON.stringify(['XS', 'S', 'M', 'L']),
            colors: JSON.stringify(['Indigo Blue', 'Dusty Rose']),
            customization: JSON.stringify({ note: 'Tunic length can be adjusted.' }),
            policies: JSON.stringify({ note: '7-day replacement for size issues.' })
        },
        {
            name: 'Gold Embroidered Fusion Cape',
            category: 'Fusion Ware',
            price: 9500,
            discountPrice: 7500,
            stock: 12,
            description: 'Ethereal fusion cape with intricate zardosi embroidery.',
            fabric: 'Fine Net with Zardosi Work',
            care: 'Dry clean only',
            images: JSON.stringify(['https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800']),
            sizes: JSON.stringify(['Free Size']),
            colors: JSON.stringify(['Champagne Gold', 'Silver Sparkle']),
            customization: JSON.stringify({ note: 'Available in custom colors on request.' }),
            policies: JSON.stringify({ note: 'Final sale item.' })
        },
        {
            name: 'Emerald Velvet Kaftan',
            category: 'Fusion Ware',
            price: 13000,
            discountPrice: 10500,
            stock: 6,
            description: 'Luxurious emerald velvet kaftan with metallic silver threadwork.',
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
            description: 'Modern peplum top paired with traditional draped dhoti pants.',
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
            description: 'The elegance of a saree meets the ease of a gown.',
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
            description: 'Intricate zardosi embroidery on a raw silk crop top.',
            fabric: 'Raw Silk',
            care: 'Dry clean only',
            images: JSON.stringify(['https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=800']),
            sizes: JSON.stringify(['XS', 'S', 'M']),
            colors: JSON.stringify(['Ivory', 'Gold']),
            customization: JSON.stringify({ note: 'Available in custom waist sizes.' }),
            policies: JSON.stringify({ note: 'Standard returns.' })
        }
    ];

    fusionProducts.forEach(p => {
        db.get(`SELECT id FROM products WHERE name = ?`, [p.name], (err, row) => {
            if (!err && !row) {
                const stmt = db.prepare(`INSERT INTO products (name, category, price, discountPrice, stock, description, fabric, care, images, sizes, colors, customization, policies) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`);
                stmt.run(p.name, p.category, p.price, p.discountPrice, p.stock, p.description, p.fabric, p.care, p.images, p.sizes, p.colors, p.customization, p.policies);
                stmt.finalize();
            }
        });
    });
    res.json({ success: true, message: "Checked and added any missing Fusion Ware products." });
});

// --- RAZORPAY WEBHOOK ---
app.use(express.json());
app.use('/uploads', express.static('uploads'));
app.use(express.static(__dirname)); // Serve frontend from root directory

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
                name TEXT, category TEXT, price REAL, discountPrice REAL, stock REAL,
                description TEXT, fabric TEXT, care TEXT, images TEXT, sizes TEXT,
                colors TEXT, customization TEXT, policies TEXT,
                shares INTEGER DEFAULT 0
            )`);
            
            // Migration for existing databases
            db.run(`ALTER TABLE products ADD COLUMN shares INTEGER DEFAULT 0`, (err) => {
                // Ignore error if column already exists
            });

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
                hero_frame_image: 'uploads/prod_1778438940521.png',
                hero_headline: 'The Art of Couture',
                hero_subtext: 'Exquisite tailoring for the discerning individual.',
                brand_title: 'Luxury Redefined',
                brand_video1: 'videos/saahna video.mp4',
                hero_float1: 'uploads/prod_1778438971269.jpeg',
                hero_float2: 'uploads/prod_1778439075485.jpeg',
                sig_card2: JSON.stringify({ id: 2, name: 'Magenta Silk Saree', category: 'Sarees', price: 12500, discountPrice: 9500, badge: 'TRENDING', image: 'uploads/prod_1778432770197.png', stock: 10 }),
                sig_card4: JSON.stringify({ id: 4, name: 'Emerald Designer Suit', category: 'Kid\'s Wear', price: 8500, discountPrice: 6500, badge: 'PREMIUM', image: 'uploads/grenn ai.png', stock: 10 })
            };
            const insertStmt = db.prepare(`INSERT OR IGNORE INTO homepage_content (key, value) VALUES (?, ?)`);
            Object.entries(defaults).forEach(([k, v]) => insertStmt.run(k, v));
            insertStmt.finalize();

            // Admin default
            const adminPass = bcrypt.hashSync('admin123', 10);
            db.run(`INSERT OR IGNORE INTO admins (email, password) VALUES (?, ?)`, ['admin@saahna.com', adminPass]);

            console.log('✅ Tables initialized.');

            // 1. Check total product count to see if we need a full seed
            db.get(`SELECT COUNT(*) as count FROM products`, (err, row) => {
                if (!err && row.count < 10) { // If nearly empty, seed the full 200 base items
                    console.log('🌱 Database is empty/low. Seeding full 200-item catalog...');
                    const categories = ["Sarees", "Fusion Ware", "Men's Wear", "Co - ord sets", "One - Piece Dress", "Frocks", "Fabrics", "Kurtis", "Lehangas", "Kid's Wear"];
                    const adjectives = ["Royal", "Classic", "Premium", "Elegant", "Luxury", "Designer", "Modern", "Traditional", "Festive", "Casual"];
                    const colors = ["Gold", "White", "Blue", "Peach", "Midnight", "Emerald", "Ruby", "Silver", "Ivory", "Rose", "Crimson"];
                    const templates = [
                        { price: 12500, desc: "Classic luxury piece.", img: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800" },
                        { price: 2500, desc: "Premium designer wear.", img: "https://images.unsplash.com/photo-1598033129183-c4f50c7176c8?auto=format&fit=crop&q=80&w=800" },
                        { price: 8500, desc: "Elegant ethnic attire.", img: "https://images.unsplash.com/photo-1583391733975-ac581b23cc7f?auto=format&fit=crop&q=80&w=800" },
                        { price: 4500, desc: "Modern fusion style.", img: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=800" }
                    ];

                    const stmt = db.prepare(`INSERT INTO products (name, category, price, discountPrice, stock, description, fabric, care, images, sizes, colors, customization, policies) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`);
                    for (let i = 1; i <= 200; i++) {
                        const cat = categories[i % categories.length];
                        const t = templates[i % templates.length];
                        const name = `${adjectives[i % adjectives.length]} ${colors[i % colors.length]} ${cat.split(" ")[0]} ${i}`;
                        stmt.run(
                            name, cat, t.price + (i * 10), t.price + (i * 10), 20, t.desc, 
                            'Silk/Cotton Mix', 'Dry Clean', JSON.stringify([t.img]), 
                            JSON.stringify(['S','M','L','XL']), JSON.stringify([colors[i % colors.length]]), 
                            JSON.stringify({}), JSON.stringify({})
                        );
                    }
                    stmt.finalize();
                    console.log('✅ 200 Base products seeded.');
                }
            });

            // 2. Seed Fusion Ware specific demo products (the 7 premium items)
            const fusionProducts = [
                {
                    name: 'Regal Fusion Velvet Gown',
                    category: 'Fusion Ware',
                    price: 14500,
                    discountPrice: 12000,
                    stock: 5,
                    description: 'A perfect blend of traditional velvet craftsmanship and modern silhouette.',
                    fabric: 'Premium Velvet & Silk',
                    care: 'Professional Dry Clean Only',
                    images: JSON.stringify(['https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=800']),
                    sizes: JSON.stringify(['S', 'M', 'L', 'XL']),
                    colors: JSON.stringify(['Deep Burgundy', 'Midnight Blue']),
                    customization: JSON.stringify({ note: 'Available for size and sleeve length.' }),
                    policies: JSON.stringify({ note: 'Non-returnable as it is a custom fusion piece.' })
                },
                {
                    name: 'Indigo Draped Fusion Set',
                    category: 'Fusion Ware',
                    price: 11000,
                    discountPrice: 8500,
                    stock: 8,
                    description: 'Contemporary draped styling meets ethnic indigo prints.',
                    fabric: 'Organic Cotton & Rayon',
                    care: 'Hand wash cold separately',
                    images: JSON.stringify(['https://images.unsplash.com/photo-1583391733975-ac581b23cc7f?auto=format&fit=crop&q=80&w=800']),
                    sizes: JSON.stringify(['XS', 'S', 'M', 'L']),
                    colors: JSON.stringify(['Indigo Blue', 'Dusty Rose']),
                    customization: JSON.stringify({ note: 'Tunic length can be adjusted.' }),
                    policies: JSON.stringify({ note: '7-day replacement for size issues.' })
                },
                {
                    name: 'Gold Embroidered Fusion Cape',
                    category: 'Fusion Ware',
                    price: 9500,
                    discountPrice: 7500,
                    stock: 12,
                    description: 'Ethereal fusion cape with intricate zardosi embroidery.',
                    fabric: 'Fine Net with Zardosi Work',
                    care: 'Dry clean only',
                    images: JSON.stringify(['https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800']),
                    sizes: JSON.stringify(['Free Size']),
                    colors: JSON.stringify(['Champagne Gold', 'Silver Sparkle']),
                    customization: JSON.stringify({ note: 'Available in custom colors on request.' }),
                    policies: JSON.stringify({ note: 'Final sale item.' })
                },
                {
                    name: 'Emerald Velvet Kaftan',
                    category: 'Fusion Ware',
                    price: 13000,
                    discountPrice: 10500,
                    stock: 6,
                    description: 'Luxurious emerald velvet kaftan with metallic silver threadwork.',
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
                    description: 'Modern peplum top paired with traditional draped dhoti pants.',
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
                    description: 'The elegance of a saree meets the ease of a gown.',
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
                    description: 'Intricate zardosi embroidery on a raw silk crop top.',
                    fabric: 'Raw Silk',
                    care: 'Dry clean only',
                    images: JSON.stringify(['https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=800']),
                    sizes: JSON.stringify(['XS', 'S', 'M']),
                    colors: JSON.stringify(['Ivory', 'Gold']),
                    customization: JSON.stringify({ note: 'Available in custom waist sizes.' }),
                    policies: JSON.stringify({ note: 'Standard returns.' })
                }
            ];

            fusionProducts.forEach(p => {
                db.get(`SELECT id FROM products WHERE name = ?`, [p.name], (err, row) => {
                    if (err) console.error(`❌ Error checking product ${p.name}:`, err.message);
                    if (!err && !row) {
                        console.log(`🌱 Seeding Fusion Ware: ${p.name}...`);
                        const stmt = db.prepare(`INSERT INTO products (name, category, price, discountPrice, stock, description, fabric, care, images, sizes, colors, customization, policies) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`);
                        stmt.run(p.name, p.category, p.price, p.discountPrice, p.stock, p.description, p.fabric, p.care, p.images, p.sizes, p.colors, p.customization, p.policies, function(err) {
                            if (err) console.error(`❌ Failed to seed ${p.name}:`, err.message);
                            else console.log(`✅ Seeded ${p.name} (ID: ${this.lastID})`);
                        });
                        stmt.finalize();
                    }
                });
            });
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

app.post('/api/admin/change-password', verifyAdmin, (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const adminId = req.admin.id;

    db.get(`SELECT * FROM admins WHERE id = ?`, [adminId], (err, admin) => {
        if (err || !admin) return res.status(404).json({ error: 'Admin not found' });

        const valid = bcrypt.compareSync(oldPassword, admin.password);
        if (!valid) return res.status(401).json({ error: 'Incorrect current password' });

        const hashedNewPassword = bcrypt.hashSync(newPassword, 10);
        db.run(`UPDATE admins SET password = ? WHERE id = ?`, [hashedNewPassword, adminId], (updateErr) => {
            if (updateErr) return res.status(500).json({ error: 'Failed to update password' });
            res.json({ success: true, message: 'Password updated successfully' });
        });
    });
});

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
    const protocol = req.protocol;
    const host = req.get('host');
    const imageUrl = `${protocol}://${host}/uploads/${req.file.filename}`;
    res.json({ imageUrl });
});

// Public upload for enquiries (no verifyAdmin)
app.post('/api/public-upload', (req, res, next) => {
    if (!upload) return res.status(500).json({ error: 'Multer not installed' });
    upload.single('image')(req, res, next);
}, (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No image uploaded' });
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

app.get('/api/products/:id', (req, res) => {
    db.get(`SELECT * FROM products WHERE id = ?`, [req.params.id], (err, r) => {
        if (err || !r) return res.status(404).json({ error: 'Product not found' });
        res.json({ 
            ...r, 
            images: JSON.parse(r.images || '[]'), 
            sizes: JSON.parse(r.sizes || '[]'),
            colors: JSON.parse(r.colors || '[]'),
            customization: JSON.parse(r.customization || '{}'),
            policies: JSON.parse(r.policies || '{}')
        });
    });
});

app.post('/api/products/:id/share', (req, res) => {
    db.run(`UPDATE products SET shares = shares + 1 WHERE id = ?`, [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
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
// --- RAZORPAY PAYMENT ROUTES ---
app.post('/api/payments/create-order', async (req, res) => {
    const { amount, currency = 'INR' } = req.body;
    try {
        const options = {
            amount: amount * 100, // Razorpay works in paise
            currency,
            receipt: 'receipt_' + Date.now(),
        };
        const order = await razorpay.orders.create(options);
        res.json(order);
    } catch (err) {
        console.error('❌ Razorpay Order Error:', err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/payments/verify', async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderDetails } = req.body;
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    const generated_signature = hmac.digest('hex');

    if (generated_signature === razorpay_signature) {
        // Payment verified! Now save order to DB
        const { items, customer, totalAmount } = orderDetails;
        const orderId = 'ORD_' + Date.now();
        
        db.run(`INSERT INTO orders (customerName, phone, email, address, city, country, totalAmount, paymentId, orderId, items, status) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
            [customer.name, customer.phone, customer.email, customer.address, customer.city, customer.country, totalAmount, razorpay_payment_id, orderId, JSON.stringify(items), 'Paid'],
            async function(err) {
                if(err) return res.status(500).json({ error: err.message });

                // Send Email Notification
                const emailHtml = `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px;">
                        <h2 style="color: #b8860b;">Thank you for your order, ${customer.name}!</h2>
                        <p>Order ID: <strong>${orderId}</strong></p>
                        <p>Total Amount: <strong>₹${totalAmount}</strong></p>
                        <hr>
                        <h3>Items:</h3>
                        <ul>
                            ${items.map(item => `<li>${item.name} - ${item.quantity} x ₹${item.price}</li>`).join('')}
                        </ul>
                        <p>We'll notify you once your package is shipped.</p>
                        <br>
                        <p>Best regards,<br>SAAHNA Team</p>
                    </div>
                `;
                await sendEmail(customer.email, 'Order Confirmation - SAAHNA', emailHtml);
                
                res.json({ success: true, orderId: orderId });
            });
    } else {
        res.status(400).json({ error: 'Invalid payment signature' });
    }
});

app.post('/api/orders', (req, res) => {
    const { items, customer, paymentMethod, totalAmount, status: bodyStatus } = req.body;
    const status = bodyStatus || (paymentMethod === 'cod' ? 'Pending (COD)' : 'Pending');
    const orderId = 'ORD_' + Date.now();
    
    db.run(`INSERT INTO orders (customerName, phone, email, address, city, country, totalAmount, paymentId, orderId, items, status) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
        [customer.name, customer.phone, customer.email, customer.address, customer.city, customer.country, totalAmount, paymentMethod, orderId, JSON.stringify(items), status],
        async function(err) {
            if(err) return res.status(500).json({ error: err.message });
            
            // Send Email for COD orders
            if (paymentMethod === 'cod') {
                const emailHtml = `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px;">
                        <h2 style="color: #b8860b;">Order Received (Cash on Delivery), ${customer.name}!</h2>
                        <p>Order ID: <strong>${orderId}</strong></p>
                        <p>Total Amount (to be paid on delivery): <strong>₹${totalAmount}</strong></p>
                        <p>Status: <strong>Pending Confirmation</strong></p>
                        <hr>
                        <h3>Items:</h3>
                        <ul>
                            ${items.map(item => `<li>${item.name} - ${item.quantity} x ₹${item.price}</li>`).join('')}
                        </ul>
                        <p>We will call you soon to confirm this order.</p>
                        <br>
                        <p>Best regards,<br>SAAHNA Team</p>
                    </div>
                `;
                await sendEmail(customer.email, 'Order Received - SAAHNA', emailHtml);
            }

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
    const period = req.query.period; // 'weekly' or 'all'
    const stats = {};
    
    let orderWhere = "";
    if (period === 'weekly') {
        orderWhere = "WHERE createdAt >= date('now', '-7 days')";
    }

    db.get(`SELECT COUNT(*) as count, SUM(totalAmount) as revenue FROM orders ${orderWhere}`, (err, row) => {
        stats.totalOrders = row.count || 0;
        stats.revenue = row.revenue || 0;
        
        db.get(`SELECT COUNT(*) as count, SUM(shares) as totalShares FROM products`, (err, row) => {
            stats.totalProducts = row.count || 0;
            stats.totalShares = row.totalShares || 0;
            
            db.get(`SELECT COUNT(*) as count FROM enquiries`, (err, row) => {
                stats.totalEnquiries = row.count || 0;
                res.json(stats);
            });
        });
    });
});

app.post('/api/stats/reset', verifyAdmin, (req, res) => {
    // This clears the orders table to reset revenue/sales stats
    db.run(`DELETE FROM orders`, [], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: 'Revenue and order history cleared.' });
    });
});

// Health check route for Railway is now at the top.
