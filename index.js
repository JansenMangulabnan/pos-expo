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
import { Server } from 'socket.io';
import http from 'http';

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
                SELECT 'seller' AS role, seller_id AS id, seller_name AS username, seller_password AS hashedPassword, seller_email AS email, profile_img AS profile_img
                FROM Seller
                WHERE seller_name = @username OR seller_email = @username
            `);

        const userRecord = await db
            .request()
            .input('username', sql.VarChar, username).query(`
                SELECT 'user' AS role, user_id AS id, user_name AS username, user_password AS hashedPassword, user_email AS email, profile_img AS profile_img
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

        // Store the entire login object in the session
        req.session.login = login;

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

        const ordersRecord = await db
            .request()
            .input('shopId', sql.Int, shopId)
            .query(`
                SELECT 
                    o.order_id,
                    p.product_name,
                    s.seller_name,
                    u.user_name,
                    o.order_date,
                    o.order_quantity,
                    o.order_final_price
                FROM [Order] o
                LEFT JOIN [Product] p ON o.order_product_id = p.product_id
                LEFT JOIN [Seller] s ON o.order_seller_id = s.seller_id
                LEFT JOIN [User] u ON o.order_user_id = u.user_id
                WHERE o.order_seller_id = @shopId
            `);

        const orders = ordersRecord.recordset;

        res.render('shop', {
            title: 'Shop',
            styles: [
                'https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css',
                'css/BASE.css',
                'css/shop.css',
                'css/shop_nav.css',
                'css/searchbar.css',
                'css/shop_modal.css',
                'css/profile.css',
                'css/shop_content_menu.css',
                'css/shop_content_POS.css',
                'css/shop_content_order.css'
            ],
            beforeBody: [],
            afterbody: [],
            nodeModules: [
                '/node_modules/jquery/dist/jquery.min.js',
            ],
            scripts: [
                'https://code.jquery.com/jquery-3.6.0.min.js',
                'https://unpkg.com/boxicons@2.1.4/dist/boxicons.js',
                '/socket.io/socket.io.js',
                'js/BASE.js',
                'js/shop_nav.js',
                'js/profile.js',
                'js/shop.js',
                'js/shop_content_menu.js',
                'js/shop_modal.js',
                'js/searchbar.js',
                'js/profile.js'
            ],
            products,
            orders,
            sellerShopId: shopId,
            shops,
            isLoggedIn: !!req.session?.login,
            loginData: req.session?.login,
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


// sellerCheckout request handler
app.post('/sellerCheckout', async (req, res) => {
    try {
        const { orders } = req.body;

        console.log("Received orders:", orders); // Debugging: Log received orders

        console.log("Session login:", JSON.stringify(req.session.login, null, 2));


        if (!orders || !Array.isArray(orders) || orders.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No orders provided or invalid format.',
            });
        }

        const sellerId = req.session?.login?.id; // Assuming seller_id is stored in the session
        if (!sellerId) {
            return res.status(401).json({
                success: false,
                message: `Unauthorized: Seller ID not found. ${sellerId}`,
            });
        }

        const db = await dbPromise;

        // Process each order
        for (const order of orders) {
            const { id: productId, name, price, quantity } = order;

            // Validate the order format
            if (!productId || !name || !price || !quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid order format for product ID: ${productId}`,
                });
            }

            console.log(`Processing order for product ID: ${productId}, Name: ${name}, Quantity: ${quantity}`);

            // Log the order in the database as "pending"
            await db
                .request()
                .input('productId', sql.Int, productId)
                .input('quantity', sql.Int, quantity)
                .input('totalPrice', sql.Decimal(10, 2), price * quantity)
                .input('sellerId', sql.Int, sellerId)
                .query(`
                    INSERT INTO [Order] (order_product_id, order_user_id, order_type, order_seller_id, order_quantity)
                    VALUES (@productId, NULL, 1, @sellerId, @quantity)
                `);
        }

        res.status(200).json({
            success: true,
            message: 'Order added to pending list successfully.',
        });
    } catch (error) {
        console.error('Error processing checkout:', error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error',
        });
    }
});

app.post('/archiveOrder', async (req, res) => {
    try {
        const { order_id } = req.body;

        const sellerShopId = req.session?.login?.seller_shop_id;
        if (!sellerShopId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: Seller shop ID not found.',
            });
        }

        const db = await dbPromise;

        // Fetch the order details
        const orderRecord = await db
            .request()
            .input('order_id', sql.Int, order_id)
            .query(`
                SELECT 
                    o.order_id AS archive_product_id,
                    p.product_name AS archive_product_name,
                    p.product_price AS archive_product_price,
                    o.order_user_id AS archive_user_id,
                    o.order_seller_id AS archive_seller_id,
                    o.order_date AS archive_order_date,
                    o.order_quantity AS archive_order_quantity,
                    o.order_type AS archive_order_type
                FROM [Order] o
                LEFT JOIN [Product] p ON o.order_product_id = p.product_id
                WHERE o.order_id = @order_id
            `);

        const order = orderRecord.recordset[0];
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found.' });
        }

        // Insert the order into the Archive table
        await db
            .request()
            .input('archive_product_id', sql.Int, order.archive_product_id)
            .input('archive_product_name', sql.VarChar, order.archive_product_name)
            .input('archive_product_price', sql.Decimal(10, 2), order.archive_product_price)
            .input('archive_user_id', sql.Int, order.archive_user_id)
            .input('archive_seller_id', sql.Int, order.archive_seller_id)
            .input('archive_order_date', sql.DateTime, order.archive_order_date)
            .input('archive_order_quantity', sql.Int, order.archive_order_quantity)
            .input('archive_order_type', sql.Int, order.archive_order_type)
            .input('archive_shop_id', sql.Int, sellerShopId)
            .query(`
                INSERT INTO Archive (
                    archive_product_id,
                    archive_product_name,
                    archive_product_price,
                    archive_user_id,
                    archive_seller_id,
                    archive_order_date,
                    archive_order_quantity,
                    archive_order_type,
                    archive_shop_id
                )
                VALUES (
                    @archive_product_id,
                    @archive_product_name,
                    @archive_product_price,
                    @archive_user_id,
                    @archive_seller_id,
                    @archive_order_date,
                    @archive_order_quantity,
                    @archive_order_type,
                    @archive_shop_id
                )
            `);

        // Delete the order from the Order table
        await db
            .request()
            .input('order_id', sql.Int, order_id)
            .query(`
                DELETE FROM [Order]
                WHERE order_id = @order_id
            `);

        res.status(200).json({ success: true, message: 'Order archived successfully.' });
    } catch (error) {
        console.error('Error archiving order:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

app.post('/confirmOrder', async (req, res) => {
    try {
        const { order_id } = req.body;

        const sellerShopId = req.session?.login?.seller_shop_id;
        if (!sellerShopId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: Seller shop ID not found.',
            });
        }

        const db = await dbPromise;

        // Fetch the order details
        const orderRecord = await db
            .request()
            .input('order_id', sql.Int, order_id)
            .query(`
                SELECT 
                    o.order_id AS history_product_id,
                    p.product_name AS history_product_name,
                    p.product_price AS history_product_price,
                    o.order_user_id AS history_user_id,
                    o.order_seller_id AS history_seller_id,
                    o.order_date AS history_order_date,
                    o.order_quantity AS history_order_quantity,
                    o.order_type AS history_order_type
                FROM [Order] o
                LEFT JOIN [Product] p ON o.order_product_id = p.product_id
                WHERE o.order_id = @order_id
            `);

        const order = orderRecord.recordset[0];
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found.' });
        }

        // Insert the order into the History table
        await db
            .request()
            .input('history_product_id', sql.Int, order.history_product_id)
            .input('history_product_name', sql.VarChar, order.history_product_name)
            .input('history_product_price', sql.Decimal(10, 2), order.history_product_price)
            .input('history_user_id', sql.Int, order.history_user_id)
            .input('history_seller_id', sql.Int, order.history_seller_id)
            .input('history_order_date', sql.DateTime, order.history_order_date)
            .input('history_order_quantity', sql.Int, order.history_order_quantity)
            .input('history_order_type', sql.Int, order.history_order_type)
            .input('history_shop_id', sql.Int, sellerShopId)
            .query(`
                INSERT INTO History (
                    history_product_id,
                    history_product_name,
                    history_product_price,
                    history_user_id,
                    history_seller_id,
                    history_order_date,
                    history_order_quantity,
                    history_order_type,
                    history_shop_id
                )
                VALUES (
                    @history_product_id,
                    @history_product_name,
                    @history_product_price,
                    @history_user_id,
                    @history_seller_id,
                    @history_order_date,
                    @history_order_quantity,
                    @history_order_type,
                    @history_shop_id
                )
            `);

        // Delete the order from the Order table
        await db
            .request()
            .input('order_id', sql.Int, order_id)
            .query(`
                DELETE FROM [Order]
                WHERE order_id = @order_id
            `);

        res.status(200).json({ success: true, message: 'Order confirmed successfully.' });
    } catch (error) {
        console.error('Error confirming order:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

// home hbs renderer
app.get('/', async (req, res) => {
    try {
        const db = await dbPromise;

        // Fetch all products
        const productRecord = await db.request().query(`
            SELECT * 
            FROM Product
        `);
        const Product = productRecord.recordset;

        res.render('home', {
            title: 'Home',
            styles: [
                'https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css',
                'css/BASE.css',
                'css/header.css',
                'css/profile.css',
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
                'js/header.js',
                'js/profile.js',
                'js/home.js',
            ],
            Product,
            isLoggedIn: !!req.session?.login,
            loginData: req.session?.login || null, // Pass the entire session login object
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

const server = http.createServer(app);

const io = new Server(server);

const activeOrders = new Map(); 

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.emit('lockedOrders', Array.from(activeOrders.entries()));

    socket.on('lockOrder', (orderId) => {
        if (activeOrders.has(orderId)) {
            socket.emit('orderAlreadyLocked', orderId);
        } else {
            activeOrders.set(orderId, socket.id);
            socket.broadcast.emit('orderLocked', { orderId, lockerId: socket.id });
        }
    });

    socket.on('unlockOrder', (orderId) => {
        if (activeOrders.get(orderId) === socket.id) {
            activeOrders.delete(orderId);
            socket.broadcast.emit('orderUnlocked', orderId);
        }
    });

    socket.on('disconnect', () => {
        for (const [orderId, lockerId] of activeOrders.entries()) {
            if (lockerId === socket.id) {
                activeOrders.delete(orderId);
                io.emit('orderUnlocked', orderId);
            }
        }
    });
});

// Start the server
server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
