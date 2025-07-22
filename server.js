require('dotenv').config();
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const basicAuth = require('express-basic-auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Admin credentials - THAY ĐỔI NGAY!
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'ThueTNCN@2024';

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Basic Auth cho admin
const adminAuth = basicAuth({
    users: { [ADMIN_USERNAME]: ADMIN_PASSWORD },
    challenge: true,
    unauthorizedResponse: (req) => {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Truy cập bị từ chối</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                        margin: 0;
                        background-color: #f5f5f5;
                    }
                    .error-box {
                        background: white;
                        padding: 40px;
                        border-radius: 10px;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                        text-align: center;
                    }
                    h1 {
                        color: #dc3545;
                        margin-bottom: 20px;
                    }
                    p {
                        color: #666;
                        margin-bottom: 20px;
                    }
                    a {
                        color: #007bff;
                        text-decoration: none;
                    }
                </style>
            </head>
            <body>
                <div class="error-box">
                    <h1>401 - Truy cập bị từ chối</h1>
                    <p>Bạn cần đăng nhập để truy cập trang này.</p>
                    <a href="/">Quay về trang chủ</a>
                </div>
            </body>
            </html>
        `;
    }
});

// Create data directory for Railway
const dataDir = process.env.RAILWAY_VOLUME_MOUNT_PATH || path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize SQLite database
const dbPath = path.join(dataDir, 'tax_website.db');
console.log('Database path:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err);
    } else {
        console.log('Connected to SQLite database');
    }
});

// Create tables
db.serialize(() => {
    // Bookings table
    db.run(`CREATE TABLE IF NOT EXISTS bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product TEXT NOT NULL,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Affiliate products table
    db.run(`CREATE TABLE IF NOT EXISTS affiliate_products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        image TEXT NOT NULL,
        link TEXT NOT NULL,
        position INTEGER DEFAULT 0
    )`);

    // Tours table
    db.run(`CREATE TABLE IF NOT EXISTS tours (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        image TEXT NOT NULL,
        departure TEXT NOT NULL,
        transport TEXT NOT NULL,
        date TEXT NOT NULL,
        price INTEGER NOT NULL,
        position INTEGER DEFAULT 0
    )`);

    // Cars table
    db.run(`CREATE TABLE IF NOT EXISTS cars (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        image TEXT NOT NULL,
        price INTEGER NOT NULL,
        position INTEGER DEFAULT 0
    )`);

    // Settings table
    db.run(`CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
    )`);

    // External links table
    db.run(`CREATE TABLE IF NOT EXISTS external_links (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        anchor_text TEXT NOT NULL,
        url TEXT NOT NULL,
        position INTEGER DEFAULT 0
    )`);

    // Meta tags table
    db.run(`CREATE TABLE IF NOT EXISTS meta_tags (
        page TEXT PRIMARY KEY,
        h1 TEXT,
        h2 TEXT,
        meta_description TEXT
    )`);

    // Popup settings table
    db.run(`CREATE TABLE IF NOT EXISTS popup_settings (
        id INTEGER PRIMARY KEY,
        enabled INTEGER DEFAULT 0,
        delay INTEGER DEFAULT 5,
        type TEXT DEFAULT 'image',
        content TEXT,
        link TEXT
    )`);

    // Insert default data if tables are empty
    db.get("SELECT COUNT(*) as count FROM settings", (err, row) => {
        if (row && row.count === 0) {
            // Insert default settings
            db.run("INSERT INTO settings (key, value) VALUES ('ga4', ''), ('search_console', ''), ('gtm', '')");
            
            // Insert sample affiliate products
            db.run(`INSERT INTO affiliate_products (title, image, link) VALUES 
                ('Sách Thuế TNCN 2024', 'https://via.placeholder.com/200', '#'),
                ('Phần mềm kế toán', 'https://via.placeholder.com/200', '#'),
                ('Khóa học thuế online', 'https://via.placeholder.com/200', '#'),
                ('Máy tính Casio', 'https://via.placeholder.com/200', '#'),
                ('Tủ hồ sơ văn phòng', 'https://via.placeholder.com/200', '#')`);

            // Insert sample tours
            db.run(`INSERT INTO tours (name, image, departure, transport, date, price) VALUES 
                ('Đà Lạt 3N2Đ', 'https://via.placeholder.com/200', 'TP.HCM', 'Máy bay', '15/02/2024', 3500000),
                ('Phú Quốc 4N3Đ', 'https://via.placeholder.com/200', 'TP.HCM', 'Máy bay', '20/02/2024', 5500000),
                ('Nha Trang 3N3Đ', 'https://via.placeholder.com/200', 'TP.HCM', 'Xe khách', '25/02/2024', 2800000),
                ('Hà Nội - Sapa 5N4Đ', 'https://via.placeholder.com/200', 'TP.HCM', 'Máy bay', '01/03/2024', 7500000),
                ('Quy Nhơn 3N2Đ', 'https://via.placeholder.com/200', 'TP.HCM', 'Máy bay', '05/03/2024', 3200000)`);

            // Insert sample cars
            db.run(`INSERT INTO cars (name, image, price) VALUES 
                ('Toyota Vios 2024', 'https://via.placeholder.com/200', 500000000),
                ('Honda City 2024', 'https://via.placeholder.com/200', 550000000),
                ('Mazda 3 2024', 'https://via.placeholder.com/200', 750000000),
                ('Hyundai Accent 2024', 'https://via.placeholder.com/200', 450000000),
                ('Kia Seltos 2024', 'https://via.placeholder.com/200', 650000000)`);

            // Insert default popup settings
            db.run("INSERT INTO popup_settings (id, enabled, delay, type, content) VALUES (1, 1, 5, 'image', 'https://via.placeholder.com/400x300')");

            // Insert sample external links
            db.run(`INSERT INTO external_links (anchor_text, url) VALUES 
                ('Tổng cục Thuế', 'https://www.gdt.gov.vn'),
                ('Bảo hiểm xã hội Việt Nam', 'https://baohiemxahoi.gov.vn'),
                ('Bộ Tài chính', 'https://www.mof.gov.vn')`);
        }
    });
});

// Serve HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve login page
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Serve admin panel - YÊU CẦU ĐĂNG NHẬP
app.get('/admin', adminAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// API Routes

// Login endpoint
app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        // Generate simple token (in production, use JWT)
        const token = Buffer.from(`${username}:${password}`).toString('base64');
        res.json({ success: true, token });
    } else {
        res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không đúng' });
    }
});

// PUBLIC APIs (không cần auth)

// Get affiliate products cho trang chính
app.get('/api/public/affiliate-products', (req, res) => {
    db.all("SELECT * FROM affiliate_products ORDER BY position, id", (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Get tours cho trang chính
app.get('/api/public/tours', (req, res) => {
    db.all("SELECT * FROM tours ORDER BY position, id", (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Get cars cho trang chính
app.get('/api/public/cars', (req, res) => {
    db.all("SELECT * FROM cars ORDER BY position, id", (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Create booking (public)
app.post('/api/bookings', (req, res) => {
    const { product, name, phone } = req.body;
    db.run("INSERT INTO bookings (product, name, phone) VALUES (?, ?, ?)",
        [product, name, phone],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ id: this.lastID, message: 'Booking created successfully' });
        }
    );
});

// Get popup settings (public)
app.get('/api/popup-settings', (req, res) => {
    db.get("SELECT * FROM popup_settings WHERE id = 1", (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(row || { enabled: false });
    });
});

// ADMIN APIs (cần auth)

// Get all bookings - ADMIN ONLY
app.get('/api/bookings', adminAuth, (req, res) => {
    db.all("SELECT * FROM bookings ORDER BY timestamp DESC", (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Get affiliate products - ADMIN
app.get('/api/affiliate-products', adminAuth, (req, res) => {
    db.all("SELECT * FROM affiliate_products ORDER BY position, id", (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Update affiliate product - ADMIN
app.put('/api/affiliate-products/:id', adminAuth, (req, res) => {
    const { title, image, link } = req.body;
    db.run("UPDATE affiliate_products SET title = ?, image = ?, link = ? WHERE id = ?",
        [title, image, link, req.params.id],
        (err) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ message: 'Product updated successfully' });
        }
    );
});

// Get tours - ADMIN
app.get('/api/tours', adminAuth, (req, res) => {
    db.all("SELECT * FROM tours ORDER BY position, id", (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Update tour - ADMIN
app.put('/api/tours/:id', adminAuth, (req, res) => {
    const { name, image, departure, transport, date, price } = req.body;
    db.run("UPDATE tours SET name = ?, image = ?, departure = ?, transport = ?, date = ?, price = ? WHERE id = ?",
        [name, image, departure, transport, date, price, req.params.id],
        (err) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ message: 'Tour updated successfully' });
        }
    );
});

// Get cars - ADMIN
app.get('/api/cars', adminAuth, (req, res) => {
    db.all("SELECT * FROM cars ORDER BY position, id", (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Update car - ADMIN
app.put('/api/cars/:id', adminAuth, (req, res) => {
    const { name, image, price } = req.body;
    db.run("UPDATE cars SET name = ?, image = ?, price = ? WHERE id = ?",
        [name, image, price, req.params.id],
        (err) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ message: 'Car updated successfully' });
        }
    );
});

// Get settings - ADMIN
app.get('/api/settings', adminAuth, (req, res) => {
    db.all("SELECT * FROM settings", (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        const settings = {};
        rows.forEach(row => {
            settings[row.key] = row.value;
        });
        res.json(settings);
    });
});

// Update settings - ADMIN
app.put('/api/settings', adminAuth, (req, res) => {
    const settings = req.body;
    const promises = [];
    
    Object.keys(settings).forEach(key => {
        promises.push(new Promise((resolve, reject) => {
            db.run("UPDATE settings SET value = ? WHERE key = ?",
                [settings[key], key],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        }));
    });

    Promise.all(promises)
        .then(() => res.json({ message: 'Settings updated successfully' }))
        .catch(err => res.status(500).json({ error: err.message }));
});

// Update popup settings - ADMIN
app.put('/api/popup-settings', adminAuth, (req, res) => {
    const { enabled, delay, type, content, link } = req.body;
    db.run("UPDATE popup_settings SET enabled = ?, delay = ?, type = ?, content = ?, link = ? WHERE id = 1",
        [enabled ? 1 : 0, delay, type, content, link],
        (err) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ message: 'Popup settings updated successfully' });
        }
    );
});

// Get external links - ADMIN
app.get('/api/external-links', adminAuth, (req, res) => {
    db.all("SELECT * FROM external_links ORDER BY position, id", (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Update external link - ADMIN
app.put('/api/external-links/:id', adminAuth, (req, res) => {
    const { anchor_text, url } = req.body;
    db.run("UPDATE external_links SET anchor_text = ?, url = ? WHERE id = ?",
        [anchor_text, url, req.params.id],
        (err) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ message: 'Link updated successfully' });
        }
    );
});

// Get meta tags - ADMIN
app.get('/api/meta-tags/:page', adminAuth, (req, res) => {
    db.get("SELECT * FROM meta_tags WHERE page = ?", [req.params.page], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(row || {});
    });
});

// Update meta tags - ADMIN
app.put('/api/meta-tags/:page', adminAuth, (req, res) => {
    const { h1, h2, meta_description } = req.body;
    db.run("INSERT OR REPLACE INTO meta_tags (page, h1, h2, meta_description) VALUES (?, ?, ?, ?)",
        [req.params.page, h1, h2, meta_description],
        (err) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ message: 'Meta tags updated successfully' });
        }
    );
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Local: http://localhost:${PORT}`);
    console.log(`Admin panel: http://localhost:${PORT}/admin`);
});