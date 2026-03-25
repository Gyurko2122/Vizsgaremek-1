const nodemailer = require("nodemailer");
const multer = require("multer");
const fs = require("fs").promises;
const path = require("path");
require("dotenv").config();

const DB_FILE = "./database.json";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  requireTLS: true,
  auth: {
    user: process.env.Email_PiacTer,
    pass: process.env.Password,
  },
  connectionTimeout: 5000,
  socketTimeout: 5000,
  logger: process.env.NODE_ENV === "development",
  debug: process.env.NODE_ENV === "development",
});

// Verify connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.error("Email transporter verification failed:", error);
  } else {
    console.log("✅ Email transporter verified and ready to send messages");
  }
});
const sendEmail = async (to, subject, username) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.Email_PiacTer,
      to: to,
      subject: subject,
      html: `<h1>Üdvözlünk, ${username}!</h1>
                   <p>Sikeres regisztráció a Piactéren!</p>`,
    });
    console.log(
      `✅ Email sikeresen elküldve a(z) ${to} címre. MessageID: ${info.messageId}`,
    );
    return true;
  } catch (error) {
    console.error(`❌ Hiba az email küldése során (${to}):`, error.message);
    console.error("Error details:", error);
    return false;
  }
};
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });

const readDatabase = async () => {
  try {
    const data = await fs.readFile(DB_FILE, "utf-8");
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
  writeDatabase,
};
