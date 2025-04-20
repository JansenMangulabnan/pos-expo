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
        cb(null, path.join(__dirname, 'public/img'));
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

//register
app.get('/register', (req, res) => {
    res.render('register', {
        title: 'Register',
        styles: [
            'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
            'css/BASE.css',
            'css/register.css',
        ],
        beforeBody: [],
        afterbody: [],
        nodeModules: [
            '/node_modules/jquery/dist/jquery.min.js',
            '/node_modules/bootstrap/dist/js/bootstrap.bundle.min.js',
        ],
        scripts: [
            'https://code.jquery.com/jquery-3.6.0.min.js',
            'js/register.js',
        ]
    });
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

//login req res
app.post('/login', async (req, res) => {
    try {
        const { username, password, type } = req.body;
        console.log(req.body);

        if (!['admin', 'user'].includes(type)) {
            return res.status(400).json({ success: false, message: 'Invalid account type.' });
        }

        const table = type === 'admin' ? 'Admin' : 'User';
        const idColumn = type === 'admin' ? 'admin_id' : 'user_id'; // Correct ID column
        const nameColumn = type === 'admin' ? 'admin_name' : 'user_name';
        const emailColumn = type === 'admin' ? 'admin_email' : 'user_email';
        const passwordColumn = type === 'admin' ? 'admin_password' : 'user_password';
        const db = await dbPromise;

        const record = await db.request()
            .input('username', sql.VarChar, username)
            .input('password', sql.VarChar, password)
            .query(
                `SELECT * FROM [${table}] WHERE (${nameColumn} = @username OR ${emailColumn} = @username) AND ${passwordColumn} = @password`
            );

        const login = record.recordset[0];
        if (!login) {
            return res.status(401).json({ success: false, message: 'Invalid login info.' });
        }

        // Set the session with the correct ID column
        req.session.login = {
            id: login[idColumn], // Use the correct ID column
            role: type,
            username: login[nameColumn]
        };

        res.json({ success: true, redirectUrl: type === 'admin' ? '/admin' : '/' });
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

        // Fetch the shop_id for the logged-in admin
        const adminRecord = await db.request()
            .input('adminId', sql.Int, adminId)
            .query('SELECT admin_shop_id FROM Admin WHERE admin_id = @adminId');

        const admin = adminRecord.recordset[0];
        if (!admin) {
            return res.status(401).send('Unauthorized access.');
        }

        const shopId = admin.admin_shop_id;

        // Fetch products for the admin's shop
        const productRecord = await db.request()
            .input('shopId', sql.Int, shopId)
            .query('SELECT * FROM Product WHERE product_shop_id = @shopId');

        const products = productRecord.recordset;

        res.render('admin', {
            title: 'Admin',
            styles: [
                'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
                'css/BASE.css',
                'css/admin.css',
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
            adminShopId: shopId // Pass the shop ID to the frontend
        });
    } catch (error) {
        console.error('Error fetching admin products:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/admin/products/add', adminUpload.single('product_img'), async (req, res) => {
    console.log('admin add trigger')
    try {
        const { product_name, product_description, product_price } = req.body;
        const product_shop_id = session.login
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
            beforeBody: [
                'views/partials/header.hbs',
            ],
            afterbody: [],
            nodeModules: [
                '/node_modules/jquery/dist/jquery.min.js',
                '/node_modules/bootstrap/dist/js/bootstrap.bundle.min.js',
            ],
            scripts: [
                'https://code.jquery.com/jquery-3.6.0.min.js',
                'js/home.js',
            ],
            Product
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});