/**
 * @file Admin Routes
 * @description Protected endpoints for admin operations: user/product management, statistics, and database cleanup
 */

const express = require("express");
const { isAdminMiddleware } = require("../middleware/auth");
const {
  Users_model,
  Products_model,
  Message_model,
  Favorite_model,
  Image_model,
} = require("../database");
const { JWT_SECRET } = require("../login");
const jwt = require("jsonwebtoken");

const router = express.Router();

/**
 * GET /api/admin/check
 * Checks if current user has admin privileges
 * Public endpoint - returns isAdmin: false if not authenticated
 * Used by frontend to show/hide admin UI
 */
router.get("/admin/check", async (req, res) => {
  const authHeader = req.headers["authorization"];

  // Return false if no token provided
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(200).json({ isAdmin: false });
  }

  try {
    // Decode and verify token
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    // Check admin status in database
    const user = await Users_model.findOne({ username: decoded.username });
    res.json({ isAdmin: user ? user.isAdmin === true : false });
  } catch (e) {
    // Token invalid or verification failed
    res.status(200).json({ isAdmin: false });
  }
});

/**
 * GET /api/admin/stats
 * Retrieves admin dashboard statistics
 * Returns counts of users, products, and messages
 * Requires admin privileges
 */
router.get("/admin/stats", isAdminMiddleware, async (req, res) => {
  try {
    // Fetch counts in parallel
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

/**
 * GET /api/admin/users
 * Retrieves list of all users with admin info
 * Returns username, email, admin status, picture, suspension details
 * Requires admin privileges
 */
router.get("/admin/users", isAdminMiddleware, async (req, res) => {
  try {
    // Fetch all users with limited fields
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

/**
 * DELETE /api/admin/users/:id
 * Deletes a user account and all associated data
 * Cannot delete admin accounts or self
 * Requires admin privileges
 */
router.delete("/admin/users/:id", isAdminMiddleware, async (req, res) => {
  try {
    // Find user to delete
    const user = await Users_model.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ error: "Felhasználó nem található" });
    }

    // Prevent self-deletion
    if (user.username === req.adminUser.username) {
      return res.status(400).json({ error: "Nem törölheted saját magad" });
    }

    // Prevent deletion of other admins
    if (user.isAdmin) {
      return res
        .status(403)
        .json({ error: "Admin felhasználót nem lehet törölni" });
    }

    // Delete user's products
    await Products_model.deleteMany({ createdBy: user.username });

    // Delete user's favorites
    await Favorite_model.deleteMany({ user: user._id });

    // Delete user's messages
    await Message_model.deleteMany({
      $or: [{ fromUser: user.username }, { toUser: user.username }],
    });

    // Delete user account
    await Users_model.findByIdAndDelete(user._id);

    res.json({ message: "Felhasználó törölve", username: user.username });
  } catch (error) {
    res.status(500).json({ error: "Szerver hiba" });
  }
});

/**
 * POST /api/admin/users/:id/suspend
 * Suspends a user account for a specified number of days
 * Cannot suspend admin accounts or self
 * Requires admin privileges
 */
router.post("/admin/users/:id/suspend", isAdminMiddleware, async (req, res) => {
  try {
    const { days, reason } = req.body;

    // Validate suspension duration (only 3, 7, or 14 days allowed)
    if (!days || ![3, 7, 14].includes(Number(days))) {
      return res
        .status(400)
        .json({ error: "Érvénytelen felfüggesztési időtartam" });
    }

    // Find user to suspend
    const user = await Users_model.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ error: "Felhasználó nem található" });
    }

    // Prevent self-suspension
    if (user.username === req.adminUser.username) {
      return res
        .status(400)
        .json({ error: "Nem függesztheted fel saját magad" });
    }

    // Prevent suspension of other admins
    if (user.isAdmin) {
      return res
        .status(403)
        .json({ error: "Admin felhasználót nem lehet felfüggeszteni" });
    }

    // Calculate suspension expiry date
    const suspendedUntil = new Date();
    suspendedUntil.setDate(suspendedUntil.getDate() + Number(days));

    // Update user with suspension info
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
});

/**
 * POST /api/admin/users/:id/unsuspend
 * Lifts suspension from a user account
 * Requires admin privileges
 */
router.post(
  "/admin/users/:id/unsuspend",
  isAdminMiddleware,
  async (req, res) => {
    try {
      // Find user
      const user = await Users_model.findById(req.params.id);

      if (!user) {
        return res.status(404).json({ error: "Felhasználó nem található" });
      }

      // Clear suspension
      user.suspendedUntil = null;
      user.suspensionReason = null;
      await user.save();

      res.json({ message: `${user.username} felfüggesztése feloldva` });
    } catch (error) {
      res.status(500).json({ error: "Szerver hiba" });
    }
  },
);

/**
 * GET /api/admin/products
 * Retrieves list of all products in the database
 * Requires admin privileges
 */
router.get("/admin/products", isAdminMiddleware, async (req, res) => {
  try {
    // Fetch all products, sorted by newest first
    const products = await Products_model.find({})
      .sort({ createdAt: -1 })
      .lean();

    res.json(products);
  } catch (error) {
    res.status(500).json({ error: "Szerver hiba" });
  }
});

/**
 * DELETE /api/admin/products/:id
 * Deletes a product and removes it from all favorites
 * Requires admin privileges
 */
router.delete("/admin/products/:id", isAdminMiddleware, async (req, res) => {
  try {
    // Find product
    const product = await Products_model.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ error: "Termék nem található" });
    }

    // Delete favorites associated with this product
    await Favorite_model.deleteMany({ product: product._id });

    // Delete product
    await Products_model.findByIdAndDelete(product._id);

    res.json({
      message: "Termék törölve",
      productName: product.productName,
    });
  } catch (error) {
    res.status(500).json({ error: "Szerver hiba" });
  }
});

/**
 * DELETE /api/admin/clear-users
 * Deletes all user accounts except the current admin
 * WARNING: This is a destructive operation
 * Requires admin privileges
 */
router.delete("/admin/clear-users", isAdminMiddleware, async (req, res) => {
  try {
    // Delete all users except the admin performing the action
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

/**
 * DELETE /api/admin/clear-products
 * Deletes all products from the database
 * WARNING: This is a destructive operation
 * Requires admin privileges
 */
router.delete("/admin/clear-products", isAdminMiddleware, async (req, res) => {
  try {
    // Delete all products
    const result = await Products_model.deleteMany({});

    res.json({
      message: "Összes termék törölve",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    res.status(500).json({ error: "Szerver hiba" });
  }
});

/**
 * DELETE /api/admin/clear-all
 * Deletes all data except user accounts
 * WARNING: This is a destructive operation
 * Requires admin privileges
 */
router.delete("/admin/clear-all", isAdminMiddleware, async (req, res) => {
  try {
    // Delete all products, messages, favorites, and images
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

/**
 * GET /api/admin/debug-images
 * Debug endpoint for viewing image references in database
 * Useful for troubleshooting image storage issues
 * Requires admin privileges
 */
router.get("/admin/debug-images", isAdminMiddleware, async (req, res) => {
  try {
    // Fetch products with image references
    const products = await Products_model.find(
      {},
      "productName imageUrl images",
    ).lean();

    // Fetch users with profile pictures
    const users = await Users_model.find({}, "username picture").lean();

    // Count total images in database
    const imageCount = await Image_model.countDocuments();

    res.json({ products, users, totalImagesInDB: imageCount });
  } catch (error) {
    res.status(500).json({ error: "Szerver hiba" });
  }
});

/**
 * POST /api/admin/reset-image-urls
 * Clears all image references and deletes image files
 * Useful for resetting corrupted image data
 * WARNING: This cannot be undone
 * Requires admin privileges
 */
router.post("/admin/reset-image-urls", isAdminMiddleware, async (req, res) => {
  try {
    // Clear picture URLs from all users
    const usersResult = await Users_model.updateMany({}, { picture: "" });

    // Clear image references from all products
    const productsResult = await Products_model.updateMany(
      {},
      { imageUrl: "", images: [] },
    );

    // Delete all image files
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

module.exports = router;
