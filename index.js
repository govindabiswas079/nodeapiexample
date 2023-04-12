import path from 'path';
import * as dotenv from 'dotenv'
import express from 'express';
import bodyParser from 'body-parser';
import multer from 'multer';
import cors from 'cors';
import https from 'https';
import fs from 'fs';
import { Connection } from './Database/Connection.js';
import UserRoute from './Router/UserRoute.js';
import UserProfileRoute from './Router/UserProfileRoute.js';
dotenv.config()

const __dirname = path.resolve();
const app = express();
app.use(bodyParser.json({ limit: '100mb' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(cors({ origin: true, credentials: true }));
app.options("*", cors({ origin: 'https://127.0.0.1:8080', optionsSuccessStatus: 200 }));
app.use(cors({ origin: "https://127.0.0.1:8080", optionsSuccessStatus: 200 }));

app.get('/api', (req, res) => {
    res.status(201).json("Home GET Request");
});

app.get('/api/docs', (req, res) => {
    res.sendFile(__dirname + '/DocsUI/index.html');
});

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.use('/api', UserRoute);
app.use('/api', UserProfileRoute);



app.use('/api/imgaes/user', (req, res) => {
    res.sendFile(path.join(__dirname, `./AssetsFiles/UserProfile${req.url}`))
});

const httpsOptions = {
    key: fs.readFileSync(path.join(__dirname, 'Security', 'key.pem')),
    cert: fs.readFileSync(path.join(__dirname, 'Security', 'cert.pem')),
}

Connection()
    .then(() => {
        try {
            https.createServer(httpsOptions, app)
                .listen(process.env?.PORT, '127.0.0.1', () => {
                    console.log(`Server connected to https://127.0.0.1:${process.env?.PORT}`)
                })
        } catch (error) {
            console.log('Cannot connect to the server', error)
        }
    })
    .catch((error) => {
        console.log("Invalid database connection...!", error);
    })
