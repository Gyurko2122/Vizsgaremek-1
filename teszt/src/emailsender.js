const nodemailer = require('nodemailer');
const multer = require('multer');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const DB_FILE = './database.json';

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.Email_PiacTer,
        pass: process.env.Password
    }
});
const sendEmail = async (to, subject, username) => {
    try {
        await transporter.sendMail({
            from: process.env.Email_PiacTer,
            to: to,
            subject: subject,
            html: `<h1>Üdvözlünk, ${username}!</h1>
                   <p>Sikeres regisztráció a Piactéren!</p>`
        });
        console.log(`Email sikeresen elküldve a(z) ${to} címre`);
        return true;
    } catch (error) {
        console.error("Hiba az email küldése során:", error);
        return false;
    }
};
const storage = multer.diskStorage({
    destination: (req, file, cb) => { cb(null, 'uploads/'); },
    filename: (req, file, cb) => { cb(null, Date.now() + path.extname(file.originalname)); }
});
const upload = multer({ storage: storage });


const readDatabase = async () => {
    try {
        const data = await fs.readFile(DB_FILE, 'utf-8');
        return data ? JSON.parse(data) : { users: [], ads: [], messages: [] };
    } catch (error) {
        return { users: [], ads: [], messages: [] };
    }
};
const writeDatabase = async (data) => {
    await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2));
};

module.exports = {
    sendEmail,
    upload,
    readDatabase,
    writeDatabase
}
