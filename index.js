import express from 'express';
import bodyParser from 'body-parser';
import multer from 'multer';
import path from 'path';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { engine } from 'express-handlebars';
import fs from 'fs';
import session from 'express-session';

const port = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const dbPromise = open({
    filename: './database.db',
    driver: sqlite3.Database
});

app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true
}));

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
        const dir = path.join(__dirname, 'public/img/cdn');
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

app

// home
app.get('/', async (req, res) => {
    const db = await dbPromise;
    const Product = await db.all('SELECT * FROM Product');
    
    res.render('home', {
        title: 'Home',
        styles: [
            '/node_modules/bootstrap/dist/css/bootstrap.min.css',
            '/node_modules/dropzone/dist/dropzone.css',
            'css/BASE.css',
            'css/home.css',
        ],
        scripts: [
            'js/home.js'
        ],
        Product
    });
});

app.listen(port, async () => {
    console.log(`Server running on http://localhost:${port}`);
    const db = await dbPromise;
    await db.migrate({ migrationPath: path.join(__dirname, 'migrations') });
});