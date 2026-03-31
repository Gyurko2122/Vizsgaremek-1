const express = require("express");
const cors = require("cors");
const path = require("path");
const multer = require("multer");
const http = require("http");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const mongoSanitize = require("express-mongo-sanitize");
const { Server } = require("socket.io");
const login = require("./login");
const { JWT_SECRET } = require("./login");
const register = require("./register");
const {
  Users_model,
  Products_model,
  Message_model,
  Favorite_model,
  Image_model,
  encryptMessage,
  decryptMessage,
} = require("./database");
const { sendEmail, sendMessageNotification } = require("./emailsender");
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});
const PORT = process.env.PORT || 3000;

// --- Socket.io felhasználó-kezelés ---
const onlineUsers = new Map(); // username -> socket.id

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("register", (username) => {
    if (username) {
      onlineUsers.set(username, socket.id);
      console.log(`User registered: ${username} -> ${socket.id}`);
    }
  });

  socket.on("sendMessage", async (data) => {
    try {
      const { fromUser, toUser, message, productId, productName } = data;
      if (!fromUser || !toUser || !message) return;
      // NoSQL injection védelem
      if (
        typeof fromUser !== "string" ||
        typeof toUser !== "string" ||
        typeof message !== "string"
      )
        return;

      const newMessage = new Message_model({
        fromUser: fromUser.trim(),
        toUser: toUser.trim(),
        message: encryptMessage(message.trim()),
        productId: productId || null,
        productName: productName || null,
        timestamp: Date.now(),
        isRead: false,
      });

      const savedMessage = await newMessage.save();

      // Visszafejtett üzenet küldése a klienseknek
      const decryptedMsg = savedMessage.toObject();
      decryptedMsg.message = decryptMessage(decryptedMsg.message);

      // Küldés a címzettnek ha online
      const recipientSocketId = onlineUsers.get(toUser);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit("newMessage", decryptedMsg);
      }

      // Visszaküldés a feladónak
      socket.emit("messageSent", decryptedMsg);

      // Email értesítés küldése
      try {
        const toUserData = await Users_model.findOne({ username: toUser });
        if (toUserData && toUserData.email) {
          sendMessageNotification(
            toUserData.email,
            fromUser,
            productName || "Üzenet",
          );
        }
      } catch (emailErr) {
        console.error("Email notification error:", emailErr);
      }
    } catch (err) {
      console.error("Socket sendMessage error:", err);
      socket.emit("messageError", { error: "Hiba az üzenet küldésénél" });
    }
  });

  socket.on("markAsRead", async (data) => {
    try {
      const { messageIds } = data;
      if (
        messageIds &&
        Array.isArray(messageIds) &&
        messageIds.every((id) => typeof id === "string") &&
        messageIds.length > 0
      ) {
        await Message_model.updateMany(
          { _id: { $in: messageIds } },
          { isRead: true },
        );
      }
    } catch (err) {
      console.error("Mark as read error:", err);
    }
  });

  socket.on("disconnect", () => {
    for (const [username, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(username);
        console.log(`User disconnected: ${username}`);
        break;
      }
    }
  });
});

console.log("Server.js - Starting initialization...");

// --- Middleware Beállítások ---
app.use(cors());
app.use(express.json());
app.use(mongoSanitize()); // NoSQL injection védelem - eltávolítja a $ és . operátorokat
app.set("trust proxy", 1);

// CSP Header beállítása - engedékeny biztonsági politika
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self' https://vizsga-ic7v.onrender.com; img-src 'self' data: http: https:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; connect-src 'self' http://localhost:3000 ws://localhost:3000 https://vizsga-ic7v.onrender.com wss://vizsga-ic7v.onrender.com; font-src 'self' data:",
  );
  next();
});

// API route-ok felcsatolása
app.use("/api", register);
app.use("/api", login);

// --- JWT Auth Middleware ---
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ error: "Nincs bejelentkezve (hiányzó token)" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { username, isAdmin }
    next();
  } catch (err) {
    return res.status(401).json({ error: "Érvénytelen vagy lejárt token" });
  }
};

// --- Token ellenőrzés endpoint (frontend session restore) ---
app.get("/api/verify-token", authMiddleware, async (req, res) => {
  try {
    const user = await Users_model.findOne({ username: req.user.username });
    if (!user) {
      return res
        .status(401)
        .json({ valid: false, error: "Felhasználó nem található" });
    }
    // Felfüggesztés ellenőrzése
    if (user.suspendedUntil && new Date(user.suspendedUntil) > new Date()) {
      return res
        .status(403)
        .json({ valid: false, error: "Fiók felfüggesztve" });
    }
    res.json({
      valid: true,
      username: user.username,
      isAdmin: user.isAdmin || false,
    });
  } catch (error) {
    console.error("Token verify error:", error);
    res.status(500).json({ valid: false, error: "Szerver hiba" });
  }
});

// --- isAdmin Middleware (JWT alapú) ---
const isAdminMiddleware = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Nincs bejelentkezve" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await Users_model.findOne({ username: decoded.username });
    if (!user || !user.isAdmin) {
      return res.status(403).json({ error: "Nincs admin jogosultság" });
    }
    req.adminUser = user;
    next();
  } catch (err) {
    return res.status(500).json({ error: "Szerver hiba" });
  }
};

// Helper: publicId generálása régi rekordokhoz
async function ensurePublicId(doc, Model) {
  if (!doc.publicId) {
    doc.publicId = crypto.randomBytes(16).toString("hex");
    await Model.findByIdAndUpdate(doc._id, { publicId: doc.publicId });
  }
  return doc;
}

// --- Multer beállítás (memoryStorage - MongoDB-be mentjük) ---
const imageFilter = (req, file, cb) => {
  const allowedMimes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Csak képfájlok engedélyezve (jpg, png, gif, webp)"));
  }
};

const uploadProfilePic = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: imageFilter,
});

const uploadProductImg = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: imageFilter,
});

app.use(express.static(path.join(__dirname, "../dist")));

// --- KÉP KISZOLGÁLÁS MongoDB-ből (publicId alapján) ---
app.get("/api/images/:identifier", async (req, res) => {
  try {
    // Először publicId alapján keresünk
    let image = await Image_model.findOne({
      publicId: req.params.identifier,
    });
    // Fallback: régi rekordoknál _id alapján
    if (!image) {
      try {
        image = await Image_model.findById(req.params.identifier);
      } catch (e) {
        // Érvénytelen ObjectId formátum - nem baj
      }
    }
    if (!image) {
      return res.status(404).json({ error: "Kép nem található" });
    }
    res.set("Content-Type", image.contentType);
    res.set("Cache-Control", "public, max-age=86400"); // 24h cache
    res.send(image.data);
  } catch (error) {
    console.error("Error serving image:", error);
    res.status(500).json({ error: "Szerver hiba" });
  }
});

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
  authMiddleware,
  uploadProfilePicHandler,
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Nincs file feltöltve" });
      }

      const username = req.user.username;

      // Kép mentése MongoDB-be
      const newImage = new Image_model({
        data: req.file.buffer,
        contentType: req.file.mimetype,
        filename: req.file.originalname,
      });
      const savedImage = await newImage.save();
      const imageUrl = `/api/images/${savedImage.publicId}`;

      // Frissítjük a felhasználó profilképét az adatbázisban
      const updateResult = await Users_model.findOneAndUpdate(
        { username },
        { picture: imageUrl },
        { returnDocument: "after" },
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
    // publicId generálása régi rekordokhoz
    for (const p of products) {
      if (!p.publicId) {
        p.publicId = crypto.randomBytes(16).toString("hex");
        await Products_model.findByIdAndUpdate(p._id, {
          publicId: p.publicId,
        });
      }
    }
    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Szerver hiba a termékek lekérésekor" });
  }
});

// Termékek lekérése felhasználó alapján (MUST be before :identifier route)
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
    // publicId generálása régi rekordokhoz
    for (const p of products) {
      if (!p.publicId) {
        p.publicId = crypto.randomBytes(16).toString("hex");
        await Products_model.findByIdAndUpdate(p._id, {
          publicId: p.publicId,
        });
      }
    }
    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Szerver hiba a termékek lekérésekor" });
  }
});

// Termék lekérése publicId vagy _id alapján
app.get("/api/products/:identifier", async (req, res) => {
  try {
    // Először publicId alapján
    let product = await Products_model.findOne({
      publicId: req.params.identifier,
    }).lean();
    // Fallback: _id alapján (régi linkek)
    if (!product) {
      try {
        product = await Products_model.findById(req.params.identifier).lean();
      } catch (e) {
        // Érvénytelen ObjectId
      }
    }
    if (!product) {
      return res.status(404).json({ error: "Termék nem található" });
    }
    // publicId generálása ha nincs
    if (!product.publicId) {
      product.publicId = crypto.randomBytes(16).toString("hex");
      await Products_model.findByIdAndUpdate(product._id, {
        publicId: product.publicId,
      });
    }
    res.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ error: "Szerver hiba a termék lekérésekor" });
  }
});

// Új termék létrehozása
app.post("/api/products", authMiddleware, async (req, res) => {
  try {
    const { productName, description, location, price, imageUrl, images } =
      req.body;
    const username = req.user.username;

    if (
      !username ||
      !productName ||
      !description ||
      !location ||
      !price ||
      (!imageUrl && (!images || images.length === 0))
    ) {
      return res.status(400).json({
        error:
          "Hiányzó mezők: username, productName, description, location, price, imageUrl/images",
      });
    }

    const allImages =
      images && images.length > 0 ? images : imageUrl ? [imageUrl] : [];

    const newProduct = new Products_model({
      productName: productName.trim(),
      description: description.trim(),
      location: location.trim(),
      price: parseFloat(price),
      imageUrl: allImages[0] || (imageUrl ? imageUrl.trim() : ""),
      images: allImages,
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
  authMiddleware,
  uploadProductImageHandler,
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Nincs file feltöltve" });
      }

      // Kép mentése MongoDB-be
      const newImage = new Image_model({
        data: req.file.buffer,
        contentType: req.file.mimetype,
        filename: req.file.originalname,
      });
      const savedImage = await newImage.save();
      const imageUrl = `/api/images/${savedImage.publicId}`;
      console.log("Product image uploaded to MongoDB:", imageUrl);
      res.json({ imageUrl });
    } catch (error) {
      console.error("Error uploading product image:", error);
      res.status(500).json({ error: "Szerver hiba" });
    }
  },
);

// Több termékkép feltöltése egyszerre
const uploadMultipleProductImagesHandler = (req, res, next) => {
  uploadProductImg.array("files", 10)(req, res, (err) => {
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
  "/api/upload/product-images",
  authMiddleware,
  uploadMultipleProductImagesHandler,
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: "Nincsenek fájlok feltöltve" });
      }

      // Minden kép mentése MongoDB-be
      const imageUrls = [];
      for (const file of req.files) {
        const newImage = new Image_model({
          data: file.buffer,
          contentType: file.mimetype,
          filename: file.originalname,
        });
        const savedImage = await newImage.save();
        imageUrls.push(`/api/images/${savedImage.publicId}`);
      }
      console.log("Product images uploaded to MongoDB:", imageUrls);
      res.json({ imageUrls });
    } catch (error) {
      console.error("Error uploading product images:", error);
      res.status(500).json({ error: "Szerver hiba" });
    }
  },
);

// Termék szerkesztése
app.put("/api/products/:id", authMiddleware, async (req, res) => {
  try {
    const { productName, description, location, price, imageUrl, images } =
      req.body;
    const username = req.user.username;

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

    const updateData = {
      productName: productName.trim(),
      description: description.trim(),
      location: location.trim(),
      price: parseFloat(price),
    };

    if (images && images.length > 0) {
      updateData.images = images;
      updateData.imageUrl = images[0];
    } else if (imageUrl) {
      updateData.imageUrl = imageUrl.trim();
    }

    // Frissítés
    const updatedProduct = await Products_model.findByIdAndUpdate(
      req.params.id,
      updateData,
      { returnDocument: "after" },
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
app.delete("/api/products/:id", authMiddleware, async (req, res) => {
  try {
    const username = req.user.username;

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

// Keresés felhasználókra és termékekre
app.get("/api/search", async (req, res) => {
  try {
    const query = req.query.q;
    if (!query || query.trim().length < 2) {
      return res.json({ users: [], products: [] });
    }

    const sanitized = query.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(sanitized, "i");

    const [users, products] = await Promise.all([
      Users_model.find({ username: regex }, { username: 1, picture: 1, _id: 0 })
        .limit(20)
        .lean(),
      Products_model.find(
        { productName: regex },
        { productName: 1, price: 1, imageUrl: 1, publicId: 1 },
      )
        .limit(20)
        .lean(),
    ]);

    // publicId generálása régi rekordokhoz
    for (const p of products) {
      if (!p.publicId) {
        p.publicId = crypto.randomBytes(16).toString("hex");
        await Products_model.findByIdAndUpdate(p._id, {
          publicId: p.publicId,
        });
      }
    }

    res.json({ users, products });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ error: "Szerver hiba a keresés során" });
  }
});

// Üzenet küldése
app.post("/api/messages", authMiddleware, async (req, res) => {
  try {
    const { toUser, message, productId, productName } = req.body;
    const fromUser = req.user.username;

    // NoSQL injection védelem
    if (typeof toUser !== "string" || typeof message !== "string") {
      return res.status(400).json({ error: "Érvénytelen bemenet" });
    }

    if (!toUser || !message) {
      return res.status(400).json({ error: "Hiányzó mezők: toUser, message" });
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
      message: encryptMessage(message.trim()),
      productId: productId || null,
      productName: productName || null,
      timestamp: Date.now(),
      isRead: false,
    });

    const savedMessage = await newMessage.save();

    // Visszafejtett üzenet küldése a klienseknek
    const decryptedMsg = savedMessage.toObject();
    decryptedMsg.message = decryptMessage(decryptedMsg.message);

    // Socket.io értesítés
    const recipientSocketId = onlineUsers.get(toUser);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("newMessage", decryptedMsg);
    }

    // Email értesítés küldése
    try {
      if (toUserExists.email) {
        sendMessageNotification(
          toUserExists.email,
          fromUser,
          productName || "Üzenet",
        );
      }
    } catch (emailErr) {
      console.error("Email notification error:", emailErr);
    }

    res
      .status(201)
      .json({ message: "Üzenet sikeresen küldve", messageData: decryptedMsg });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ error: "Szerver hiba az üzenet küldésénél" });
  }
});

// Beszélgetések lekérése egy felhasználóhoz (csoportosítva partner + termék alapján)
app.get("/api/conversations/:username", authMiddleware, async (req, res) => {
  try {
    const { username } = req.params;
    if (req.user.username !== username) {
      return res.status(403).json({ error: "Nincs jogosultságod" });
    }
    const messages = await Message_model.find({
      $or: [{ fromUser: username }, { toUser: username }],
    })
      .sort({ timestamp: -1 })
      .lean();

    // Üzenetek visszafejtése
    for (const msg of messages) {
      msg.message = decryptMessage(msg.message);
    }

    // Csoportosítás partner alapján (1 user = 1 beszélgetés)
    const conversationMap = new Map();
    for (const msg of messages) {
      const partner = msg.fromUser === username ? msg.toUser : msg.fromUser;
      if (!conversationMap.has(partner)) {
        const unreadCount = messages.filter(
          (m) => m.toUser === username && m.fromUser === partner && !m.isRead,
        ).length;

        // Lekérjük a partner profilképét
        let partnerPicture = null;
        try {
          const partnerUser = await Users_model.findOne({ username: partner });
          if (partnerUser) {
            partnerPicture = partnerUser.picture || null;
          }
        } catch (e) {
          // ignore
        }

        // Összegyűjtjük az érdeklődési termékeket
        const productNames = [
          ...new Set(
            messages
              .filter(
                (m) =>
                  (m.fromUser === partner || m.toUser === partner) &&
                  m.productName,
              )
              .map((m) => m.productName),
          ),
        ];

        conversationMap.set(partner, {
          partner,
          partnerPicture,
          productId: msg.productId,
          productName: msg.productName,
          productNames,
          lastMessage: msg.message,
          lastTimestamp: msg.timestamp,
          unreadCount,
        });
      }
    }

    res.json(Array.from(conversationMap.values()));
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({ error: "Szerver hiba a beszélgetések lekérésekor" });
  }
});

// Olvasatlan üzenetek száma
app.get("/api/messages/unread/:username", authMiddleware, async (req, res) => {
  try {
    if (req.user.username !== req.params.username) {
      return res.status(403).json({ error: "Nincs jogosultságod" });
    }
    const count = await Message_model.countDocuments({
      toUser: req.params.username,
      isRead: false,
    });
    res.json({ unreadCount: count });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    res.status(500).json({ error: "Szerver hiba" });
  }
});

// Üzenetek olvasottnak jelölése
app.put("/api/messages/mark-read", authMiddleware, async (req, res) => {
  try {
    const { messageIds } = req.body;
    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
      return res.status(400).json({ error: "Hiányzó messageIds" });
    }
    // NoSQL injection védelem - csak string ID-ket fogadunk el
    if (!messageIds.every((id) => typeof id === "string")) {
      return res.status(400).json({ error: "Érvénytelen messageIds" });
    }
    await Message_model.updateMany(
      { _id: { $in: messageIds } },
      { isRead: true },
    );
    res.json({ message: "Üzenetek olvasottnak jelölve" });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    res.status(500).json({ error: "Szerver hiba" });
  }
});

// Üzenetek lekérése két felhasználó között
app.get("/api/messages/:fromUser/:toUser", authMiddleware, async (req, res) => {
  try {
    const { fromUser, toUser } = req.params;

    if (!fromUser || !toUser) {
      return res.status(400).json({ error: "Hiányzó paraméterek" });
    }

    // Csak a saját üzeneteit kérheti le
    if (req.user.username !== fromUser && req.user.username !== toUser) {
      return res.status(403).json({ error: "Nincs jogosultságod" });
    }

    const messages = await Message_model.find({
      $or: [
        { fromUser, toUser },
        { fromUser: toUser, toUser: fromUser },
      ],
    })
      .sort({ timestamp: 1 })
      .lean();

    // Üzenetek visszafejtése
    for (const msg of messages) {
      msg.message = decryptMessage(msg.message);
    }

    res.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Szerver hiba az üzenetek lekérésekor" });
  }
});

// Beszélgetés törlése két felhasználó között
app.delete(
  "/api/conversations/:username/:partner",
  authMiddleware,
  async (req, res) => {
    try {
      const username = req.user.username;
      const { partner } = req.params;

      if (!username || !partner) {
        return res.status(400).json({ error: "Hiányzó paraméterek" });
      }

      const result = await Message_model.deleteMany({
        $or: [
          { fromUser: username, toUser: partner },
          { fromUser: partner, toUser: username },
        ],
      });

      res.json({
        success: true,
        deletedCount: result.deletedCount,
      });
    } catch (error) {
      console.error("Error deleting conversation:", error);
      res.status(500).json({ error: "Szerver hiba a beszélgetés törlésekor" });
    }
  },
);

// --- FAVORITE ENDPOINTS ---

// Felhasználó fiók törlése
app.delete("/api/user/:username", authMiddleware, async (req, res) => {
  try {
    const { username } = req.params;
    const { confirmUsername } = req.body;

    // Ellenőrizzük, hogy a token tulajdonosa törli a saját fiókját
    if (req.user.username !== username) {
      return res
        .status(403)
        .json({ error: "Nincs jogosultságod törölni ezt a fiókot" });
    }

    if (!confirmUsername || confirmUsername !== username) {
      return res
        .status(400)
        .json({ error: "Felhasználónév megerősítés szükséges" });
    }

    const user = await Users_model.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: "Felhasználó nem található" });
    }

    // Töröljük a felhasználó termékeit
    await Products_model.deleteMany({ createdBy: username });

    // Töröljük a kedvenceket
    await Favorite_model.deleteMany({ user: user._id });

    // Töröljük az üzeneteket
    await Message_model.deleteMany({
      $or: [{ fromUser: username }, { toUser: username }],
    });

    // Töröljük a felhasználót
    await Users_model.findByIdAndDelete(user._id);

    res.json({ message: "Fiók sikeresen törölve" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Szerver hiba a fiók törlésénél" });
  }
});

// Kedvencek lekérése felhasználónév alapján
app.get("/api/favorites/:username", authMiddleware, async (req, res) => {
  try {
    const user = await Users_model.findOne({ username: req.params.username });
    if (!user) {
      return res.status(404).json({ error: "Felhasználó nem található" });
    }
    const favorites = await Favorite_model.find({ user: user._id }).lean();
    const productIds = favorites.map((f) => f.product.toString());
    res.json({ productIds });
  } catch (error) {
    console.error("Error fetching favorites:", error);
    res.status(500).json({ error: "Szerver hiba" });
  }
});

// Kedvenc termékek adatainak lekérése felhasználónév alapján
app.get(
  "/api/favorites/:username/products",
  authMiddleware,
  async (req, res) => {
    try {
      const user = await Users_model.findOne({ username: req.params.username });
      if (!user) {
        return res.status(404).json({ error: "Felhasználó nem található" });
      }
      const favorites = await Favorite_model.find({ user: user._id })
        .sort({ favoritedAt: -1 })
        .lean();
      const productIds = favorites.map((f) => f.product);
      const products = await Products_model.find({
        _id: { $in: productIds },
      }).lean();
      res.json(products);
    } catch (error) {
      console.error("Error fetching favorite products:", error);
      res.status(500).json({ error: "Szerver hiba" });
    }
  },
);

// Kedvenc hozzáadása
app.post("/api/favorites", authMiddleware, async (req, res) => {
  try {
    const username = req.user.username;
    const { productId } = req.body;
    if (!productId || typeof productId !== "string") {
      return res.status(400).json({ error: "Hiányzó vagy érvénytelen mezők" });
    }
    const user = await Users_model.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: "Felhasználó nem található" });
    }
    const existing = await Favorite_model.findOne({
      user: user._id,
      product: productId,
    });
    if (existing) {
      return res.json({ message: "Már kedvenc" });
    }
    const fav = new Favorite_model({ user: user._id, product: productId });
    await fav.save();
    res.status(201).json({ message: "Kedvencekhez adva" });
  } catch (error) {
    console.error("Error adding favorite:", error);
    res.status(500).json({ error: "Szerver hiba" });
  }
});

// Kedvenc eltávolítása
app.delete("/api/favorites", authMiddleware, async (req, res) => {
  try {
    const username = req.user.username;
    const { productId } = req.body;
    if (!productId || typeof productId !== "string") {
      return res.status(400).json({ error: "Hiányzó vagy érvénytelen mezők" });
    }
    const user = await Users_model.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: "Felhasználó nem található" });
    }
    await Favorite_model.findOneAndDelete({
      user: user._id,
      product: productId,
    });
    res.json({ message: "Eltávolítva a kedvencekből" });
  } catch (error) {
    console.error("Error removing favorite:", error);
    res.status(500).json({ error: "Szerver hiba" });
  }
});

// --- ADMIN ENDPOINTS (Védett - isAdmin szükséges) ---

// Admin jogosultság ellenőrzése
app.get("/api/admin/check", async (req, res) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(200).json({ isAdmin: false });
  }
  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await Users_model.findOne({ username: decoded.username });
    res.json({ isAdmin: user ? user.isAdmin === true : false });
  } catch (e) {
    res.status(200).json({ isAdmin: false });
  }
});

// Admin statisztikák
app.get("/api/admin/stats", isAdminMiddleware, async (req, res) => {
  try {
    const [userCount, productCount, messageCount] = await Promise.all([
      Users_model.countDocuments(),
      Products_model.countDocuments(),
      Message_model.countDocuments(),
    ]);
    res.json({ userCount, productCount, messageCount });
  } catch (error) {
    res.status(500).json({ error: "Szerver hiba" });
  }
});

// Összes felhasználó lekérése (admin)
app.get("/api/admin/users", isAdminMiddleware, async (req, res) => {
  try {
    const users = await Users_model.find(
      {},
      {
        username: 1,
        email: 1,
        isAdmin: 1,
        picture: 1,
        suspendedUntil: 1,
        suspensionReason: 1,
      },
    )
      .sort({ username: 1 })
      .lean();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Szerver hiba" });
  }
});

// Felhasználó törlése (admin)
app.delete("/api/admin/users/:id", isAdminMiddleware, async (req, res) => {
  try {
    const user = await Users_model.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "Felhasználó nem található" });
    }
    // Admin nem törölheti saját magát
    if (user.username === req.adminUser.username) {
      return res.status(400).json({ error: "Nem törölheted saját magad" });
    }
    // Admin nem törölhet másik admint
    if (user.isAdmin) {
      return res
        .status(403)
        .json({ error: "Admin felhasználót nem lehet törölni" });
    }
    // Töröljük a felhasználó termékeit, kedvenceit, üzeneteit
    await Products_model.deleteMany({ createdBy: user.username });
    await Favorite_model.deleteMany({ user: user._id });
    await Message_model.deleteMany({
      $or: [{ fromUser: user.username }, { toUser: user.username }],
    });
    await Users_model.findByIdAndDelete(user._id);
    res.json({ message: "Felhasználó törölve", username: user.username });
  } catch (error) {
    res.status(500).json({ error: "Szerver hiba" });
  }
});

// Felhasználó felfüggesztése (admin)
app.post(
  "/api/admin/users/:id/suspend",
  isAdminMiddleware,
  async (req, res) => {
    try {
      const { days, reason } = req.body;
      if (!days || ![3, 7, 14].includes(Number(days))) {
        return res
          .status(400)
          .json({ error: "Érvénytelen felfüggesztési időtartam" });
      }
      const user = await Users_model.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "Felhasználó nem található" });
      }
      if (user.username === req.adminUser.username) {
        return res
          .status(400)
          .json({ error: "Nem függesztheted fel saját magad" });
      }
      if (user.isAdmin) {
        return res
          .status(403)
          .json({ error: "Admin felhasználót nem lehet felfüggeszteni" });
      }
      const suspendedUntil = new Date();
      suspendedUntil.setDate(suspendedUntil.getDate() + Number(days));
      user.suspendedUntil = suspendedUntil;
      user.suspensionReason = reason || "Nincs megadva ok";
      await user.save();
      res.json({
        message: `${user.username} felfüggesztve ${days} napra`,
        suspendedUntil: user.suspendedUntil,
        suspensionReason: user.suspensionReason,
      });
    } catch (error) {
      console.error("Suspend error:", error);
      res.status(500).json({ error: "Szerver hiba" });
    }
  },
);

// Felfüggesztés feloldása (admin)
app.post(
  "/api/admin/users/:id/unsuspend",
  isAdminMiddleware,
  async (req, res) => {
    try {
      const user = await Users_model.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "Felhasználó nem található" });
      }
      user.suspendedUntil = null;
      user.suspensionReason = null;
      await user.save();
      res.json({ message: `${user.username} felfüggesztése feloldva` });
    } catch (error) {
      res.status(500).json({ error: "Szerver hiba" });
    }
  },
);

// Összes termék lekérése (admin)
app.get("/api/admin/products", isAdminMiddleware, async (req, res) => {
  try {
    const products = await Products_model.find({})
      .sort({ createdAt: -1 })
      .lean();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: "Szerver hiba" });
  }
});

// Termék törlése (admin)
app.delete("/api/admin/products/:id", isAdminMiddleware, async (req, res) => {
  try {
    const product = await Products_model.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: "Termék nem található" });
    }
    // Kedvencek törlése
    await Favorite_model.deleteMany({ product: product._id });
    await Products_model.findByIdAndDelete(product._id);
    res.json({
      message: "Termék törölve",
      productName: product.productName,
    });
  } catch (error) {
    res.status(500).json({ error: "Szerver hiba" });
  }
});

// Clear all users from database (admin only)
app.delete("/api/admin/clear-users", isAdminMiddleware, async (req, res) => {
  try {
    const result = await Users_model.deleteMany({
      _id: { $ne: req.adminUser._id },
    });
    res.json({
      message: "Felhasználók törölve (admin kivételével)",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    res.status(500).json({ error: "Szerver hiba" });
  }
});

// Clear all products from database (admin only)
app.delete("/api/admin/clear-products", isAdminMiddleware, async (req, res) => {
  try {
    const result = await Products_model.deleteMany({});
    res.json({
      message: "Összes termék törölve",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    res.status(500).json({ error: "Szerver hiba" });
  }
});

// Clear all data (admin only)
app.delete("/api/admin/clear-all", isAdminMiddleware, async (req, res) => {
  try {
    const productsResult = await Products_model.deleteMany({});
    const messagesResult = await Message_model.deleteMany({});
    const favoritesResult = await Favorite_model.deleteMany({});
    const imagesResult = await Image_model.deleteMany({});

    res.json({
      message: "Összes adat törölve (felhasználók kivételével)",
      deletedProducts: productsResult.deletedCount,
      deletedMessages: messagesResult.deletedCount,
      deletedFavorites: favoritesResult.deletedCount,
      deletedImages: imagesResult.deletedCount,
    });
  } catch (error) {
    res.status(500).json({ error: "Szerver hiba" });
  }
});

// Debug images (admin only)
app.get("/api/admin/debug-images", isAdminMiddleware, async (req, res) => {
  try {
    const products = await Products_model.find(
      {},
      "productName imageUrl images",
    ).lean();
    const users = await Users_model.find({}, "username picture").lean();
    const imageCount = await Image_model.countDocuments();

    res.json({ products, users, totalImagesInDB: imageCount });
  } catch (error) {
    res.status(500).json({ error: "Szerver hiba" });
  }
});

// Reset image URLs (admin only)
app.post("/api/admin/reset-image-urls", isAdminMiddleware, async (req, res) => {
  try {
    const usersResult = await Users_model.updateMany({}, { picture: "" });
    const productsResult = await Products_model.updateMany(
      {},
      { imageUrl: "", images: [] },
    );
    const imagesResult = await Image_model.deleteMany({});

    res.json({
      message: "Képek resetelve az adatbázisban",
      updatedUsers: usersResult.modifiedCount,
      updatedProducts: productsResult.modifiedCount,
      deletedImages: imagesResult.deletedCount,
    });
  } catch (error) {
    res.status(500).json({ error: "Szerver hiba" });
  }
});

// SPA Fallback - serve index.html for any unmatched routes (React Router)
// Ne szolgáljon ki HTML-t API és upload kérésekhez
app.use((req, res, next) => {
  if (req.path.startsWith("/api/") || req.path.startsWith("/uploads/")) {
    return res.status(404).json({ error: "Nem található" });
  }
  res.sendFile(path.join(__dirname, "../dist/index.html"));
});

// --- Szerver Indítása ---
server.listen(PORT, () => {
  console.log(`✅ A Piactér szerver fut a http://localhost:${PORT} címen`);
  console.log("Server.js - Initialization complete!");
});
