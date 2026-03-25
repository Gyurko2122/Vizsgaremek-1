const express = require("express");
const cors = require("cors");
const path = require("path");
const multer = require("multer");
const fs = require("fs");
const login = require("./login");
const register = require("./register");
const { Users_model, Products_model, Message_model } = require("./database");
const app = express();
const PORT = 3000;

console.log("Server.js - Starting initialization...");

// --- Middleware Beállítások ---
app.use(cors());
app.use(express.json());

// CSP Header beállítása - engedékeny biztonsági politika
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; img-src 'self' data: http: https:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; connect-src 'self' http://localhost:3000; font-src 'self' data:",
  );
  next();
});

// Upload könyvtárak létrehozása
const uploadDir = path.join(__dirname, "../uploads");
const profilePicsDir = path.join(uploadDir, "profile-pictures");
const productImgsDir = path.join(uploadDir, "product-images");

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
if (!fs.existsSync(profilePicsDir)) fs.mkdirSync(profilePicsDir);
if (!fs.existsSync(productImgsDir)) fs.mkdirSync(productImgsDir);

// --- Multer beállítás ---
const profilePicStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, profilePicsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-profile${ext}`;
    cb(null, uniqueName);
  },
});

const productImgStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, productImgsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-product${ext}`;
    cb(null, uniqueName);
  },
});

const uploadProfilePic = multer({
  storage: profilePicStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedMimes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Csak képfájlok engedélyezve (jpg, png, gif, webp)"));
    }
  },
});

const uploadProductImg = multer({
  storage: productImgStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedMimes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Csak képfájlok engedélyezve (jpg, png, gif, webp)"));
    }
  },
});

app.use(express.static(path.join(__dirname, "../dist")));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.use("/api", register);
app.use("/api", login);

// --- USER ENDPOINTS ---

// Felhasználó adatainak lekérése
app.get("/api/user/:username", async (req, res) => {
  try {
    const user = await Users_model.findOne({ username: req.params.username });
    if (!user) {
      return res.status(404).json({ error: "Felhasználó nem található" });
    }
    res.json({
      username: user.username,
      email: user.email,
      picture: user.picture || null,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Szerver hiba" });
  }
});

// Profilkép feltöltése
const uploadProfilePicHandler = (req, res, next) => {
  uploadProfilePic.single("file")(req, res, (err) => {
    if (err) {
      console.error("Multer error:", err);
      return res
        .status(400)
        .json({ error: err.message || "Kép feltöltési hiba" });
    }
    next();
  });
};

app.post(
  "/api/upload/profile-picture",
  uploadProfilePicHandler,
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Nincs file feltöltve" });
      }

      const imageUrl = `http://localhost:3000/uploads/profile-pictures/${req.file.filename}`;
      const username = req.query.username; // Get username from query parameter

      if (!username) {
        return res.status(400).json({ error: "Felhasználónév hiányzik" });
      }

      // Frissítjük a felhasználó profilképét az adatbázisban
      await Users_model.updateOne({ username }, { picture: imageUrl });

      console.log(`Profile picture uploaded for user: ${username}`);
      res.json({ imageUrl });
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      res.status(500).json({ error: "Szerver hiba" });
    }
  },
);

// --- PRODUCT ENDPOINTS ---

// Összes termék lekérése (legújabbak előre)
app.get("/api/products", async (req, res) => {
  try {
    const products = await Products_model.find({}).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Szerver hiba" });
  }
});

// Termék lekérése ID alapján
app.get("/api/products/:id", async (req, res) => {
  try {
    const product = await Products_model.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: "Termék nem található" });
    }
    res.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ error: "Szerver hiba" });
  }
});

// Termékek lekérése felhasználó alapján
app.get("/api/products/user/:username", async (req, res) => {
  try {
    // A Products sémában nincs username mező alapértelmezetten,
    // szükséges lehet a séma módosítása
    const products = await Products_model.find({
      createdBy: req.params.username,
    });
    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Szerver hiba" });
  }
});

// Új termék létrehozása
app.post("/api/products", async (req, res) => {
  try {
    const { username, productName, description, location, price, imageUrl } =
      req.body;

    if (!productName || !description || !location || !price || !imageUrl) {
      return res.status(400).json({ error: "Hiányzó mezők" });
    }

    const newProduct = new Products_model({
      productName,
      description,
      location,
      price: parseFloat(price),
      imageUrl,
      createdBy: username,
    });

    await newProduct.save();
    res.json({ message: "Termék sikeresen létrehozva", product: newProduct });
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ error: "Szerver hiba" });
  }
});

// Termékkép feltöltése
const uploadProductImageHandler = (req, res, next) => {
  uploadProductImg.single("file")(req, res, (err) => {
    if (err) {
      console.error("Multer error:", err);
      return res
        .status(400)
        .json({ error: err.message || "Kép feltöltési hiba" });
    }
    next();
  });
};

app.post(
  "/api/upload/product-image",
  uploadProductImageHandler,
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Nincs file feltöltve" });
      }

      const imageUrl = `http://localhost:3000/uploads/product-images/${req.file.filename}`;
      console.log("Product image uploaded:", imageUrl);
      res.json({ imageUrl });
    } catch (error) {
      console.error("Error uploading product image:", error);
      res.status(500).json({ error: "Szerver hiba" });
    }
  },
);

// Termék törlése
app.delete("/api/products/:id", async (req, res) => {
  try {
    const { username } = req.body;
    const product = await Products_model.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ error: "Termék nem található" });
    }

    if (product.createdBy !== username) {
      return res
        .status(403)
        .json({ error: "Nincs jogosultságod törölni ezt a terméket" });
    }

    await Products_model.findByIdAndDelete(req.params.id);
    res.json({ message: "Termék sikeresen törölve" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ error: "Szerver hiba" });
  }
});

// --- MESSAGE ENDPOINTS ---

// Üzenet küldése
app.post("/api/messages", async (req, res) => {
  try {
    const { fromUser, toUser, message } = req.body;

    if (!fromUser || !toUser || !message) {
      return res.status(400).json({ error: "Hiányzó mezők" });
    }

    const newMessage = new Message_model({
      fromUser,
      toUser,
      message,
      timestamp: Date.now(),
      isRead: false,
    });

    await newMessage.save();
    res.json({ message: "Üzenet sikeresen küldve", messageData: newMessage });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ error: "Szerver hiba" });
  }
});

// Üzenetek lekérése két felhasználó között
app.get("/api/messages/:fromUser/:toUser", async (req, res) => {
  try {
    const { fromUser, toUser } = req.params;

    const messages = await Message_model.find({
      $or: [
        { fromUser, toUser },
        { fromUser: toUser, toUser: fromUser },
      ],
    }).sort({ timestamp: 1 });

    res.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Szerver hiba" });
  }
});

// SPA Fallback - serve index.html for any unmatched routes (React Router)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "../dist/index.html"));
});

// --- Szerver Indítása ---
app.listen(PORT, () => {
  console.log(`✅ A Piactér szerver fut a http://localhost:${PORT} címen`);
  console.log("Server.js - Initialization complete!");
});
