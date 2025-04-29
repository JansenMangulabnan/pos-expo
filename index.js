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
        trustServerCertificate: true,
    },
};

const dbPromise = sql.connect(sqlConfig);

const sellerStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, 'public/img');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});

const sellerUpload = multer({ storage: sellerStorage });

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
    },
});

const scheduleUpload = multer({ storage: scheduleStorage });

app.engine(
    'hbs',
    engine({
        extname: '.hbs',
        helpers: {
            include: (path) => fs.readFileSync(join(__dirname, path), 'utf-8'),
        },
    })
);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(
    session({
        secret: 'your_secret_key',
        resave: false,
        saveUninitialized: true,
    })
);

app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.status(500).json({
                success: false,
                message: 'Failed to log out. Please try again.',
            });
        }
        res.clearCookie('connect.sid');
        res.status(200).json({ success: true });
    });
});

//signup hbs renderer
app.get('/signup', (req, res) => {
    res.render('signup', {
        title: 'Sign Up',
        styles: [
            'https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css',
            'css/BASE.css',
            'css/signup.css',
        ],
        beforeBody: [],
        afterbody: [],
        nodeModules: [
            '/node_modules/jquery/dist/jquery.min.js',
        ],
        scripts: [
            'https://code.jquery.com/jquery-3.6.0.min.js',
            'https://unpkg.com/boxicons@2.1.4/dist/boxicons.js',
            'js/signup.js',
        ],
    });
});

//signup request handler
app.post('/signup', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res
                .status(400)
                .json({ success: false, message: 'Invalid email format.' });
        }

        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 8 characters long.',
            });
        }

        const db = await dbPromise;

        const userCheck = await db
            .request()
            .input('username', sql.VarChar, username)
            .input('email', sql.VarChar, email).query(`
                SELECT * FROM [User]
                WHERE user_name = @username OR user_email = @email
            `);

        if (userCheck.recordset.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Username or email already exists.',
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await db
            .request()
            .input('username', sql.VarChar, username)
            .input('email', sql.VarChar, email)
            .input('password', sql.VarChar, hashedPassword).query(`
                INSERT INTO [User] (user_name, user_email, user_password)
                VALUES (@username, @email, @password)
            `);

        req.session.login = {
            id: username,
            role: 'user',
            username: username,
        };

        res.status(200).json({
            success: true,
            message: 'User registered successfully. Redirecting...',
            redirectUrl: '/',
        });
    } catch (error) {
        console.error('Error during signup:', error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error',
        });
    }
});

//login hbs renderer
app.get('/login', (req, res) => {
    res.render('login', {
        title: 'Login',
        styles: [
            'https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css',
            'css/BASE.css',
            'css/login.css',
        ],
        beforeBody: [],
        afterbody: [],
        nodeModules: [
            '/node_modules/jquery/dist/jquery.min.js',
        ],
        scripts: [
            'https://code.jquery.com/jquery-3.6.0.min.js',
            'https://unpkg.com/boxicons@2.1.4/dist/boxicons.js',
            'js/login.js',
        ],
    });
});

// Login request handler
app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        const db = await dbPromise;

        const sellerRecord = await db
            .request()
            .input('username', sql.VarChar, username).query(`
                SELECT 'seller' AS role, seller_id AS id, seller_name AS username, seller_password AS hashedPassword
                FROM Seller
                WHERE seller_name = @username OR seller_email = @username
            `);

        const userRecord = await db
            .request()
            .input('username', sql.VarChar, username).query(`
                SELECT 'user' AS role, user_id AS id, user_name AS username, user_password AS hashedPassword
                FROM [User] 
                WHERE user_name = @username OR user_email = @username
            `);

        const login = sellerRecord.recordset[0] || userRecord.recordset[0];

        if (!login) {
            return res
                .status(401)
                .json({ success: false, message: 'Invalid login info.' });
        }

        let isPasswordValid = await bcrypt.compare(
            password,
            login.hashedPassword
        );

        if (!isPasswordValid && password === login.hashedPassword) {
            isPasswordValid = true;
        }

        if (!isPasswordValid) {
            return res
                .status(401)
                .json({ success: false, message: 'Invalid login info.' });
        }

        if (login.role === 'seller') {
            const sellerShopRecord = await db
                .request()
                .input('sellerId', sql.Int, login.id)
                .query(`
                    SELECT seller_shop_id FROM Seller WHERE seller_id = @sellerId
                `);

            const sellerShop = sellerShopRecord.recordset[0];
            if (sellerShop) {
                login.seller_shop_id = sellerShop.seller_shop_id;
            }
        }

        req.session.login = {
            id: login.id,
            role: login.role,
            username: login.username,
            seller_shop_id: login.seller_shop_id || null,
        };

        res.json({
            success: true,
            redirectUrl: login.role === 'seller' ? '/shop' : '/',
        });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error',
        });
    }
});

function isLoggedIn(req, res, next) {
    if (req.session.login) {
        return next();
    }
    res.redirect('/login');
}
function isSeller(req, res, next) {
    if (!req.session?.login || req.session.login.role !== 'seller') {
        return res.redirect('/login?error=unauthorized');
    }
    next();
}

//shop renderer
app.get('/shop', isSeller, async (req, res) => {
    try {
        const sellerId = req.session.login.id;
        const db = await dbPromise;

        const sellerRecord = await db
            .request()
            .input('sellerId', sql.Int, sellerId)
            .query(`
                SELECT seller_shop_id 
                FROM Seller 
                WHERE seller_id = @sellerId
                `);

        const seller = sellerRecord.recordset[0];
        if (!seller) {
            return res.status(401).send('Unauthorized access.');
        }

        const shopId = seller.seller_shop_id;

        const productRecord = await db
            .request()
            .input('shopId', sql.Int, shopId)
            .query(`SELECT * 
                FROM Product 
                WHERE product_shop_id = @shopId
            `);

        const products = productRecord.recordset;

        const shopRecord = await db
            .request()
            .input('shopId', sql.Int, shopId)
            .query(`
                SELECT *
                FROM Shop
                WHERE shop_id = @shopId
            `);

        const shops = shopRecord.recordset;
        res.render('shop', {
            title: 'Shop',
            styles: [
                'https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css',
                'css/BASE.css',
                'css/shop.css',
                'css/shop_nav.css',
                'css/searchbar.css',
                'css/shop_modal.css',
                'css/shop_content_menu.css',
            ],
            beforeBody: [],
            afterbody: [],
            nodeModules: [
                '/node_modules/jquery/dist/jquery.min.js',
            ],
            scripts: [
                'https://code.jquery.com/jquery-3.6.0.min.js',
                'https://unpkg.com/boxicons@2.1.4/dist/boxicons.js',
                'js/BASE.js',
                'js/shop_nav.js',
                'js/shop.js',
                'js/shop_content_menu.js',
                'js/shop_modal.js',
                'js/searchbar.js',
            ],
            products,
            sellerShopId: shopId,
            shops,
            isLoggedIn: !!req.session?.login,
            username: req.session?.login?.username || null,
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).send('Internal Server Error');
    }
});

//sellerAdd request handler
app.post('/sellerAdd', sellerUpload.single('product_img'), async (req, res) => {
    try {
        const {
            product_name,
            product_description,
            product_stock,
            product_category,
            product_price,
        } = req.body;

        const product_shop_id = req.session?.login?.seller_shop_id;
        if (!product_shop_id) {
            return res
                .status(401)
                .send('Unauthorized: Seller shop ID not found.');
        }

        const product_img = req.file ? `/img/${req.file.filename}` : null;

        const db = await dbPromise;

        await db
            .request()
            .input('product_img', sql.VarChar, product_img)
            .input('product_name', sql.VarChar, product_name)
            .input('product_description', sql.VarChar, product_description)
            .input('product_stock', sql.Int, product_stock)
            .input('product_category', sql.VarChar, product_category)
            .input('product_price', sql.Decimal(10, 2), product_price)
            .input('product_shop_id', sql.Int, product_shop_id).query(`
                INSERT INTO Product 
                (product_img, product_name, product_description, product_stock, product_category, product_price, product_shop_id) 
                VALUES 
                (@product_img, @product_name, @product_description, @product_stock, @product_category, @product_price, @product_shop_id)`);

        res.status(200).send('Product added successfully.');
    } catch (error) {
        console.error('Error adding product:', error);
        res.status(500).send('Internal Server Error');
    }
});

//sellerUpdate request handler
app.post('/sellerUpdate', async (req, res) => {
    try {
        const {
            product_id,
            product_img,
            product_name,
            product_description,
            product_stock,
            product_category,
            product_price,
        } = req.body;

        const db = await dbPromise;

        await db
            .request()
            .input('product_id', sql.Int, product_id)
            .input('product_img', sql.VarChar, product_img)
            .input('product_name', sql.VarChar, product_name)
            .input('product_description', sql.VarChar, product_description)
            .input('product_stock', sql.Int, product_stock)
            .input('product_category', sql.VarChar, product_category)
            .input('product_price', sql.Decimal(10, 2), product_price)
            .query(`
                UPDATE Product
                SET 
                    product_img = @product_img,
                    product_name = @product_name,
                    product_description = @product_description,
                    product_stock = @product_stock,
                    product_category = @product_category,
                    product_price = @product_price
                WHERE product_id = @product_id
            `);

        res.status(200).send("Product updated successfully.");
    } catch (error) {
        console.error("Error updating product:", error);
        res.status(500).send("Internal Server Error");
    }
});

// sellerUpload request handler
app.post("/uploadImage", sellerUpload.single("product_img"), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send("No file uploaded.");
        }

        // Return the file path to the client
        res.status(200).json({ filePath: `/img/${req.file.filename}` });
    } catch (error) {
        console.error("Error uploading image:", error);
        res.status(500).send("Internal Server Error");
    }
});

//sellerUpdateWithImage request handler
app.post("/sellerUpdateWithImage", sellerUpload.single("product_img"), async (req, res) => {
    try {
        const { product_id, product_name, product_description, product_stock, product_category, product_price } = req.body;

        const db = await dbPromise;

        // Retrieve the current product details from the database
        const currentProduct = await db
            .request()
            .input("product_id", sql.Int, product_id)
            .query(`
                SELECT product_img
                FROM Product
                WHERE product_id = @product_id
            `);

        // Use the old image path if no new file is uploaded
        const product_img = req.file ? `/img/${req.file.filename}` : currentProduct.recordset[0].product_img;

        // Update the product in the database
        await db
            .request()
            .input("product_id", sql.Int, product_id)
            .input("product_img", sql.VarChar, product_img)
            .input("product_name", sql.VarChar, product_name)
            .input("product_description", sql.VarChar, product_description)
            .input("product_stock", sql.Int, product_stock)
            .input("product_category", sql.VarChar, product_category)
            .input("product_price", sql.Decimal(10, 2), product_price)
            .query(`
                UPDATE Product
                SET 
                    product_img = @product_img,
                    product_name = @product_name,
                    product_description = @product_description,
                    product_stock = @product_stock,
                    product_category = @product_category,
                    product_price = @product_price
                WHERE product_id = @product_id
            `);

        // Return the updated product details
        res.status(200).json({
            product_id,
            product_img,
            product_name,
            product_description,
            product_stock,
            product_category,
            product_price,
        });
    } catch (error) {
        console.error("Error updating product:", error);
        res.status(500).send("Internal Server Error");
    }
});

//sellerDelete request handler
app.post('/sellerDelete', async (req, res) => {
    try {
        const { product_id } = req.body;

        const db = await dbPromise;

        await db
            .request()
            .input('product_id', sql.Int, product_id)
            .query(`
                DELETE FROM Product
                WHERE product_id = @product_id
            `);

        res.status(200).send("Product deleted successfully.");
    } catch (error) {
        console.error("Error deleting product:", error);
        res.status(500).send("Internal Server Error");
    }
});

// home hbs renderer
app.get('/', async (req, res) => {
    try {
        const db = await dbPromise;
        const record = await db.request()
        .query(`
            SELECT * 
            FROM Product
        `);
        const Product = record.recordset;

        res.render('home', {
            title: 'Home',
            styles: [
                'https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css',
                'css/BASE.css',
                'css/header.css',
                'css/searchbar.css',
                'css/home.css',
            ],
            beforeBody: [],
            afterbody: [],
            nodeModules: [
                '/node_modules/jquery/dist/jquery.min.js',
            ],
            scripts: [
                'https://code.jquery.com/jquery-3.6.0.min.js',
                'https://unpkg.com/boxicons@2.1.4/dist/boxicons.js',
                'js/BASE.js',
                'js/home.js',
            ],
            Product,
            isLoggedIn: !!req.session?.login,
            username: req.session?.login?.username || null,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
