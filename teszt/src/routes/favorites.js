/**
 * @file Favorite Routes
 * @description Endpoints for managing user's favorite products
 */

const express = require("express");
const { Users_model, Products_model, Favorite_model } = require("../database");
const { authMiddleware } = require("../middleware/auth");

const router = express.Router();

/**
 * GET /api/favorites/:username
 * Gets IDs of all products favorited by a user
 */
router.get("/favorites/:username", authMiddleware, async (req, res) => {
  try {
    // Find user
    const user = await Users_model.findOne({ username: req.params.username });

    if (!user) {
      return res.status(404).json({ error: "Felhasználó nem található" });
    }

    // Get favorite records
    const favorites = await Favorite_model.find({ user: user._id }).lean();

    // Extract product IDs
    const productIds = favorites.map((f) => f.product.toString());

    res.json({ productIds });
  } catch (error) {
    console.error("Error fetching favorites:", error);
    res.status(500).json({ error: "Szerver hiba" });
  }
});

/**
 * GET /api/favorites/:username/products
 * Gets full product data for all favorites of a user
 * Returns complete product documents, sorted by favorite date
 */
router.get(
  "/favorites/:username/products",
  authMiddleware,
  async (req, res) => {
    try {
      // Find user
      const user = await Users_model.findOne({ username: req.params.username });

      if (!user) {
        return res.status(404).json({ error: "Felhasználó nem található" });
      }

      // Get favorites sorted by most recent
      const favorites = await Favorite_model.find({ user: user._id })
        .sort({ favoritedAt: -1 })
        .lean();

      // Extract product IDs
      const productIds = favorites.map((f) => f.product);

      // Fetch full product data
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

/**
 * POST /api/favorites
 * Adds a product to user's favorites
 * Prevents duplicate favorites
 */
router.post("/favorites", authMiddleware, async (req, res) => {
  try {
    const username = req.user.username;
    const { productId } = req.body;

    // Validate productId
    if (!productId || typeof productId !== "string") {
      return res.status(400).json({ error: "Hiányzó vagy érvénytelen mezők" });
    }

    // Find user
    const user = await Users_model.findOne({ username });

    if (!user) {
      return res.status(404).json({ error: "Felhasználó nem található" });
    }

    // Check if already favorited
    const existing = await Favorite_model.findOne({
      user: user._id,
      product: productId,
    });

    if (existing) {
      return res.json({ message: "Már kedvenc" });
    }

    // Create new favorite
    const fav = new Favorite_model({ user: user._id, product: productId });
    await fav.save();

    res.status(201).json({ message: "Kedvencekhez adva" });
  } catch (error) {
    console.error("Error adding favorite:", error);
    res.status(500).json({ error: "Szerver hiba" });
  }
});

/**
 * DELETE /api/favorites
 * Removes a product from user's favorites
 */
router.delete("/favorites", authMiddleware, async (req, res) => {
  try {
    const username = req.user.username;
    const { productId } = req.body;

    // Validate productId
    if (!productId || typeof productId !== "string") {
      return res.status(400).json({ error: "Hiányzó vagy érvénytelen mezők" });
    }

    // Find user
    const user = await Users_model.findOne({ username });

    if (!user) {
      return res.status(404).json({ error: "Felhasználó nem található" });
    }

    // Delete favorite
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

module.exports = router;
