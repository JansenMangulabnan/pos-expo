import express from 'express';
import { engine } from 'express-handlebars';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';
import multer from 'multer';
import path from 'path';
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

app.engine('handlebars', engine({
    helpers: {
        include: (path) => fs.readFileSync(join(__dirname, path), `utf-8`),
    }
}));
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
            'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
            'css/BASE.css',
            'css/home.css',
        ],
        beforeBody: [
            'views/partials/header.handlebars'
        ],
        afterbody: [],
        nodeModules: [
            '/node_modules/jquery/dist/jquery.min.js',
            '/node_modules/bootstrap/dist/js/bootstrap.bundle.min.js',
        ],
        scripts: [
            'https://code.jquery.com/jquery-3.6.0.min.js',
            'js/home.js'
        ],
        Product,
    });
});

app.listen(port, async () => {
    console.log(`Server running on http://localhost:${port}`);
    const db = await dbPromise;
    await db.migrate({ migrationPath: path.join(__dirname, 'migrations') });
});