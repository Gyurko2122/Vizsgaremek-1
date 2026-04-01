const mongoose = require("mongoose");
const crypto = require("crypto");

const { connect, Schema, model } = mongoose;

require("dotenv").config();

const URI = process.env.MONGODB_URI;
const Name = process.env.DATABASE_NAME;

// --- Üzenet titkosítás (AES-256-CBC) ---
const ENCRYPTION_KEY = (() => {
  const key = process.env.MESSAGE_ENCRYPTION_KEY;
  if (key && key.trim().length >= 32) {
    // Ha pontosan 64 hex karakter, használjuk közvetlenül
    if (/^[0-9a-fA-F]{64}$/.test(key.trim())) return key.trim();
    // Egyébként sha256 hash-eljük 64 hex karakterre
    return crypto.createHash("sha256").update(key.trim()).digest("hex");
  }
  console.warn(
    "⚠️  MESSAGE_ENCRYPTION_KEY nincs beállítva vagy túl rövid. Állítsd be a .env fájlban!",
  );
  return crypto
    .createHash("sha256")
    .update("piacter-default-encryption-key-change-in-production")
    .digest("hex");
})();
const IV_LENGTH = 16;

function encryptMessage(text) {
  if (!text) return text;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    Buffer.from(ENCRYPTION_KEY, "hex"),
    iv,
  );
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

function decryptMessage(text) {
  if (!text || !text.includes(":")) return text;
  try {
    const parts = text.split(":");
    const iv = Buffer.from(parts.shift(), "hex");
    const encrypted = parts.join(":");
    const decipher = crypto.createDecipheriv(
      "aes-256-cbc",
      Buffer.from(ENCRYPTION_KEY, "hex"),
      iv,
    );
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (e) {
    // Ha nem sikerül a visszafejtés, eredeti szöveg (régi, titkosítatlan üzenet)
    return text;
  }
}

console.log("Database.js - Attempting to connect to MongoDB...");

connect(URI)
  .then(() => {
    console.log("✅ Connected to MongoDB database successfully.");
  })
  .catch((err) => {
    console.error("❌ Error connecting to MongoDB database:", err.message);
    process.exit(1);
  });

const Users = new Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email: {
    type: String,
    unique: true,
    required: true,
    match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
    trim: true,
  },
  password: { type: String, required: true, minlength: 8 },
  picture: { type: String, required: false, trim: true },
  isAdmin: { type: Boolean, required: true, default: false },
  suspendedUntil: { type: Date, default: null },
  suspensionReason: { type: String, default: null },
});

// Védelem: új felhasználó regisztrálása SOHA nem lehet admin
// Csak adatbázisban kézzel vagy admin végponton keresztül állítható
Users.pre("save", function () {
  if (this.isNew) {
    this.isAdmin = false;
  }
});

const Users_model = model("Users", Users);

const Products = new Schema({
  publicId: {
    type: String,
    unique: true,
    default: () => crypto.randomBytes(16).toString("hex"),
  },
  productName: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  location: { type: String, required: true, trim: true },
  imageUrl: { type: String, required: false, trim: true },
  images: [{ type: String, trim: true }],
  price: { type: Number, required: true, min: 0 },
  createdBy: { type: String, required: true },
  createdAt: { type: Date, required: true, default: Date.now },
});

const Favorite = new Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "Users", required: true },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Products",
    required: true,
  },
  favoritedAt: { type: Date, required: true, default: Date.now },
});

const MessageSchema = new Schema({
  fromUser: String,
  toUser: String,
  message: String,
  productId: { type: String, default: null },
  productName: { type: String, default: null },
  timestamp: { type: Number, default: Date.now },
  isRead: { type: Boolean, default: false },
});

const ImageSchema = new Schema({
  publicId: {
    type: String,
    unique: true,
    default: () => crypto.randomBytes(16).toString("hex"),
  },
  data: { type: Buffer, required: true },
  contentType: { type: String, required: true },
  filename: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
});

const Favorite_model = model("Favorite", Favorite);
const Message_model = model("Message", MessageSchema);
const Image_model = model("Image", ImageSchema);

const Products_model = model("Products", Products);

module.exports = {
  Users_model,
  Products_model,
  Message_model,
  Favorite_model,
  Image_model,
  encryptMessage,
  decryptMessage,
};
