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
app.set("trust proxy", 1);

// CSP Header beállítása - engedékeny biztonsági politika
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self' https://vizsga-ic7v.onrender.com; img-src 'self' data: http: https:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; connect-src 'self' http://localhost:3000 https://vizsga-ic7v.onrender.com; font-src 'self' data:",
  );
  next();
});

// Cache-Control header middleware - képekhez
app.use("/uploads", (req, res, next) => {
  // Rövid cache időtartam az URLben timestamp-mel verziólt képeknél
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.setHeader("ETag", `"${Date.now()}"`);
  next();
});

// Static files szervírozása immutable cache-kel
app.use("/api", register);
app.use("/api", login);
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
app.use(
  "/uploads",
  express.static(path.join(__dirname, "../uploads"), {
    maxAge: "1h",
    etag: false,
  }),
);
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
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Szerver hiba az felhasználó lekérésekor" });
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

      const username = req.query.username; // Get username from query parameter

      if (!username) {
        return res.status(400).json({ error: "Felhasználónév hiányzik" });
      }

      // Cache-busting: timestamp hozzáadása az URL-hez
      const timestamp = Date.now();
      const imageUrl = `/uploads/profile-pictures/${req.file.filename}?v=${timestamp}`;

      // Frissítjük a felhasználó profilképét az adatbázisban
      const updateResult = await Users_model.findOneAndUpdate(
        { username },
        { picture: imageUrl },
        { new: true },
      );

      if (!updateResult) {
        return res.status(404).json({ error: "Felhasználó nem található" });
      }

      console.log(
        `Profile picture uploaded for user: ${username} - URL: ${imageUrl}`,
      );
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
    const products = await Products_model.find({})
      .sort({ createdAt: -1 })
      .lean();
    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Szerver hiba a termékek lekérésekor" });
  }
});

// Termék lekérése ID alapján
app.get("/api/products/:id", async (req, res) => {
  try {
    const product = await Products_model.findById(req.params.id).lean();
    if (!product) {
      return res.status(404).json({ error: "Termék nem található" });
    }
    res.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ error: "Szerver hiba a termék lekérésekor" });
  }
});

// Termékek lekérése felhasználó alapján
app.get("/api/products/user/:username", async (req, res) => {
  try {
    const products = await Products_model.find({
      createdBy: req.params.username,
    })
      .sort({ createdAt: -1 })
      .lean();

    if (!products || products.length === 0) {
      return res.json([]);
    }
    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Szerver hiba a termékek lekérésekor" });
  }
});

// Új termék létrehozása
app.post("/api/products", async (req, res) => {
  try {
    const { username, productName, description, location, price, imageUrl } =
      req.body;

    if (
      !username ||
      !productName ||
      !description ||
      !location ||
      !price ||
      !imageUrl
    ) {
      return res.status(400).json({
        error:
          "Hiányzó mezők: username, productName, description, location, price, imageUrl",
      });
    }

    const newProduct = new Products_model({
      productName: productName.trim(),
      description: description.trim(),
      location: location.trim(),
      price: parseFloat(price),
      imageUrl: imageUrl.trim(),
      createdBy: username.trim(),
      createdAt: new Date(),
    });

    const savedProduct = await newProduct.save();
    res
      .status(201)
      .json({ message: "Termék sikeresen létrehozva", product: savedProduct });
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({
      error: "Szerver hiba a termék létrehozásakor: " + error.message,
    });
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

      // Cache-busting: timestamp hozzáadása az URL-hez
      const timestamp = Date.now();
      const imageUrl = `/uploads/product-images/${req.file.filename}?v=${timestamp}`;
      console.log("Product image uploaded:", imageUrl);
      res.json({ imageUrl });
    } catch (error) {
      console.error("Error uploading product image:", error);
      res.status(500).json({ error: "Szerver hiba" });
    }
  },
);

// Termék szerkesztése
app.put("/api/products/:id", async (req, res) => {
  try {
    const { username, productName, description, location, price } = req.body;

    if (!username) {
      return res.status(400).json({ error: "Felhasználónév hiányzik" });
    }

    const product = await Products_model.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ error: "Termék nem található" });
    }

    if (product.createdBy !== username) {
      return res
        .status(403)
        .json({ error: "Nincs jogosultságod szerkeszteni ezt a terméket" });
    }

    // Validáció
    if (!productName || !description || !location || price === undefined) {
      return res.status(400).json({ error: "Hiányzó mezők" });
    }

    // Frissítés
    const updatedProduct = await Products_model.findByIdAndUpdate(
      req.params.id,
      {
        productName: productName.trim(),
        description: description.trim(),
        location: location.trim(),
        price: parseFloat(price),
      },
      { new: true },
    );

    res.json({
      message: "Termék sikeresen frissítve",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ error: "Szerver hiba a termék szerkesztésénél" });
  }
});

// Termék törlése
app.delete("/api/products/:id", async (req, res) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ error: "Felhasználónév hiányzik" });
    }

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
    res.json({ message: "Termék sikeresen törölve", productId: req.params.id });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ error: "Szerver hiba a termék törlésénél" });
  }
});

// --- MESSAGE ENDPOINTS ---

// Üzenet küldése
app.post("/api/messages", async (req, res) => {
  try {
    const { fromUser, toUser, message } = req.body;

    if (!fromUser || !toUser || !message) {
      return res
        .status(400)
        .json({ error: "Hiányzó mezők: fromUser, toUser, message" });
    }

    if (fromUser === toUser) {
      return res.status(400).json({ error: "Nem küldhetsz üzenetet magadnak" });
    }

    // Ellenőrizd, hogy a felhasználók léteznek-e
    const fromUserExists = await Users_model.findOne({ username: fromUser });
    const toUserExists = await Users_model.findOne({ username: toUser });

    if (!fromUserExists || !toUserExists) {
      return res.status(404).json({ error: "Az egyik felhasználó nem jelen" });
    }

    const newMessage = new Message_model({
      fromUser: fromUser.trim(),
      toUser: toUser.trim(),
      message: message.trim(),
      timestamp: Date.now(),
      isRead: false,
    });

    const savedMessage = await newMessage.save();
    res
      .status(201)
      .json({ message: "Üzenet sikeresen küldve", messageData: savedMessage });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ error: "Szerver hiba az üzenet küldésénél" });
  }
});

// Üzenetek lekérése két felhasználó között
app.get("/api/messages/:fromUser/:toUser", async (req, res) => {
  try {
    const { fromUser, toUser } = req.params;

    if (!fromUser || !toUser) {
      return res.status(400).json({ error: "Hiányzó paraméterek" });
    }

    const messages = await Message_model.find({
      $or: [
        { fromUser, toUser },
        { fromUser: toUser, toUser: fromUser },
      ],
    })
      .sort({ timestamp: 1 })
      .lean();

    res.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Szerver hiba az üzenetek lekérésekor" });
  }
});

// --- ADMIN ENDPOINTS (Development) ---

// Clear all users from database
app.delete("/api/admin/clear-users", async (req, res) => {
  try {
    const result = await Users_model.deleteMany({});
    res.json({
      message: "Összes felhasználó törölve",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Error clearing users:", error);
    res.status(500).json({ error: "Szerver hiba" });
  }
});

// Clear all products from database
app.delete("/api/admin/clear-products", async (req, res) => {
  try {
    const result = await Products_model.deleteMany({});
    res.json({
      message: "Összes termék törölve",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Error clearing products:", error);
    res.status(500).json({ error: "Szerver hiba" });
  }
});

// Clear all data (users and products)
app.delete("/api/admin/clear-all", async (req, res) => {
  try {
    const usersResult = await Users_model.deleteMany({});
    const productsResult = await Products_model.deleteMany({});
    const messagesResult = await Message_model.deleteMany({});

    res.json({
      message: "Összes adat törölve",
      deletedUsers: usersResult.deletedCount,
      deletedProducts: productsResult.deletedCount,
      deletedMessages: messagesResult.deletedCount,
    });
  } catch (error) {
    console.error("Error clearing all data:", error);
    res.status(500).json({ error: "Szerver hiba" });
  }
});

// Reset image URLs in database (fix broken URLs)
app.post("/api/admin/reset-image-urls", async (req, res) => {
  try {
    // Reset all user profile pictures to empty
    const usersResult = await Users_model.updateMany({}, { picture: "" });

    // Reset all product image URLs to empty
    const productsResult = await Products_model.updateMany(
      {},
      { imageUrl: "" },
    );

    res.json({
      message: "Képek resetelve az adatbázisban",
      updatedUsers: usersResult.modifiedCount,
      updatedProducts: productsResult.modifiedCount,
    });
  } catch (error) {
    console.error("Error resetting image URLs:", error);
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
