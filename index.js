import express from 'express';
import { engine } from 'express-handlebars';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import session from 'express-session';
import sql from 'mssql';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

dotenv.config();

const port = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

const sqlConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    options: {
        encrypt: true,
        trustServerCertificate: true
    }
};

const dbPromise = sql.connect(sqlConfig);

const adminStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, 'public/img');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const adminUpload = multer({ storage: adminStorage });

const scheduleStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, 'public/img');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const scheduleUpload = multer({ storage: scheduleStorage });

app.engine('hbs', engine({
    extname: '.hbs',
    helpers: {
        include: (path) => fs.readFileSync(join(__dirname, path), `utf-8`)
    }
}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true
}));

//signup hbs render
app.get('/signup', (req, res) => {
    res.render('signup', {
        title: 'Sign Up',
        styles: [
            'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
            'css/BASE.css',
            'css/signup.css',
        ],
        beforeBody: [],
        afterbody: [],
        nodeModules: [
            '/node_modules/jquery/dist/jquery.min.js',
            '/node_modules/bootstrap/dist/js/bootstrap.bundle.min.js',
        ],
        scripts: [
            'https://code.jquery.com/jquery-3.6.0.min.js',
            'js/signup.js',
        ]
    });
});

app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.status(500).json({ success: false, message: 'Failed to log out. Please try again.' });
        }
        res.clearCookie('connect.sid');
        res.status(200).json({ success: true });
    });
});

//signup request handler
app.post('/signup', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ success: false, message: 'Invalid email format.' });
        }

        if (password.length < 8) {
            return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long.' });
        }

        const db = await dbPromise;

        const userCheck = await db.request()
            .input('username', sql.VarChar, username)
            .input('email', sql.VarChar, email)
            .query(`
                SELECT * FROM [User]
                WHERE user_name = @username OR user_email = @email
            `);

        if (userCheck.recordset.length > 0) {
            return res.status(400).json({ success: false, message: 'Username or email already exists.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await db.request()
            .input('username', sql.VarChar, username)
            .input('email', sql.VarChar, email)
            .input('password', sql.VarChar, hashedPassword)
            .query(`
                INSERT INTO [User] (user_name, user_email, user_password)
                VALUES (@username, @email, @password)
            `);

        req.session.login = {
            id: username,
            role: 'user',
            username: username
        };

        res.status(200).json({ success: true, message: 'User registered successfully. Redirecting...', redirectUrl: '/' });
    } catch (error) {
        console.error('Error during signup:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

//login hbs render
app.get('/login', (req, res) => {
    res.render('login', {
        title: 'Login',
        styles: [
            'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
            'css/BASE.css',
            'css/login.css',
        ],
        beforeBody: [],
        afterbody: [],
        nodeModules: [
            '/node_modules/jquery/dist/jquery.min.js',
            '/node_modules/bootstrap/dist/js/bootstrap.bundle.min.js',
        ],
        scripts: [
            'https://code.jquery.com/jquery-3.6.0.min.js',
            'js/login.js',
        ]
    });
});

// Login request handler
app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        const db = await dbPromise;

        const adminRecord = await db.request()
            .input('username', sql.VarChar, username)
            .query(`
                SELECT 'admin' AS role, admin_id AS id, admin_name AS username, admin_password AS hashedPassword
                FROM Admin
                WHERE admin_name = @username OR admin_email = @username
            `);

        const userRecord = await db.request()
            .input('username', sql.VarChar, username)
            .query(`
                SELECT 'user' AS role, user_id AS id, user_name AS username, user_password AS hashedPassword
                FROM [User]
                WHERE user_name = @username OR user_email = @username
            `);

        const login = adminRecord.recordset[0] || userRecord.recordset[0];

        if (!login) {
            return res.status(401).json({ success: false, message: 'Invalid login info.' });
        }

        let isPasswordValid = await bcrypt.compare(password, login.hashedPassword);

        if (!isPasswordValid && password === login.hashedPassword) {
            isPasswordValid = true;
        }

        if (!isPasswordValid) {
            return res.status(401).json({ success: false, message: 'Invalid login info.' });
        }

        if (login.role === 'admin') {
            const adminShopRecord = await db.request()
                .input('adminId', sql.Int, login.id)
                .query('SELECT admin_shop_id FROM Admin WHERE admin_id = @adminId');

            const adminShop = adminShopRecord.recordset[0];
            if (adminShop) {
                login.admin_shop_id = adminShop.admin_shop_id;
            }
        }

        req.session.login = {
            id: login.id,
            role: login.role,
            username: login.username,
            admin_shop_id: login.admin_shop_id || null 
        };

        res.json({ success: true, redirectUrl: login.role === 'admin' ? '/admin' : '/' });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

function isLoggedIn(req, res, next) {
    if (req.session.login) {
        return next();
    }
    res.redirect('/login');
}
function isAdmin(req, res, next) {
    if (!req.session?.login || req.session.login.role !== 'admin') {
        return res.redirect('/login?error=unauthorized');
    }
    next();
}

//admin
app.get('/admin', isAdmin, async (req, res) => {
    try {
        const adminId = req.session.login.id;
        const db = await dbPromise;

        const adminRecord = await db.request()
            .input('adminId', sql.Int, adminId)
            .query('SELECT admin_shop_id FROM Admin WHERE admin_id = @adminId');

        const admin = adminRecord.recordset[0];
        if (!admin) {
            return res.status(401).send('Unauthorized access.');
        }

        const shopId = admin.admin_shop_id;

        const productRecord = await db.request()
            .input('shopId', sql.Int, shopId)
            .query('SELECT * FROM Product WHERE product_shop_id = @shopId');

        const products = productRecord.recordset;

        const shopRecord = await db.request()
            .input('shopId', sql.Int, shopId)
            .query('SELECT * FROM Shop WHERE shop_id = @shopId');
            
        const shops = shopRecord.recordset;
        res.render('admin', {
            title: 'Admin',
            styles: [
                'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
                'css/BASE.css',
                'css/admin.css'
            ],
            beforeBody: [],
            afterbody: [],
            nodeModules: [
                '/node_modules/jquery/dist/jquery.min.js',
                '/node_modules/bootstrap/dist/js/bootstrap.bundle.min.js',
            ],
            scripts: [
                'https://code.jquery.com/jquery-3.6.0.min.js',
                'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js',
                'js/admin.js',
            ],
            products,
            adminShopId: shopId,
            shops
        });
    } catch (error) {
        console.error('Error fetching admin products:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/adminAdd', adminUpload.single('product_img'), async (req, res) => {
    try {
        const { product_name, product_description, product_price } = req.body;

        const product_shop_id = req.session?.login?.admin_shop_id;
        if (!product_shop_id) {
            return res.status(401).send('Unauthorized: Admin shop ID not found.');
        }

        const product_img = req.file ? `/img/${req.file.filename}` : null;

        const db = await dbPromise;

        await db.request()
            .input('product_name', sql.VarChar, product_name)
            .input('product_description', sql.VarChar, product_description)
            .input('product_price', sql.Decimal(10, 2), product_price)
            .input('product_img', sql.VarChar, product_img)
            .input('product_shop_id', sql.Int, product_shop_id)
            .query(`
                INSERT INTO Product (product_name, product_description, product_price, product_img, product_shop_id)
                VALUES (@product_name, @product_description, @product_price, @product_img, @product_shop_id)
            `);

        res.status(200).send('Product added successfully.');
    } catch (error) {
        console.error('Error adding product:', error);
        res.status(500).send('Internal Server Error');
    }
});

// home hbs render
app.get('/', async (req, res) => {
    try {
        const db = await dbPromise;
        const record = await db.request().query('SELECT * FROM Product');
        const Product = record.recordset;

        res.render('home', {
            title: 'Home',
            styles: [
                'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
                'css/BASE.css',
                'css/home.css',
            ],
            beforeBody: [],
            afterbody: [],
            nodeModules: [
                '/node_modules/jquery/dist/jquery.min.js',
                '/node_modules/bootstrap/dist/js/bootstrap.bundle.min.js',
            ],
            scripts: [
                'https://code.jquery.com/jquery-3.6.0.min.js',
                'js/BASE.js',
                'js/home.js',
            ],
            Product,
            isLoggedIn: !!req.session?.login,
            username: req.session?.login?.username || null
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});