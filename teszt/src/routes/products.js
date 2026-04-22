/**
 * @file Product Routes
 * @description Endpoints for creating, reading, updating, and deleting products
 */

const express = require("express");
const crypto = require("crypto");
const { Products_model } = require("../database");
const { authMiddleware } = require("../middleware/auth");
const { ensurePublicId } = require("../utils/imageHelper");

const router = express.Router();

/**
 * Helper function to add publicId to old products that don't have one
 * @param {Array} products - Array of product documents
 */
async function addPublicIdsToProducts(products) {
  for (const p of products) {
    if (!p.publicId) {
      p.publicId = crypto.randomBytes(16).toString("hex");
      await Products_model.findByIdAndUpdate(p._id, {
        publicId: p.publicId,
      });
    }
  }
}

/**
 * GET /api/products
 * Retrieves all products sorted by newest first
 * Generates publicId for old records automatically
 */
router.get("/products", async (req, res) => {
  try {
    // Fetch all products sorted by creation date (newest first)
    const products = await Products_model.find({})
      .sort({ createdAt: -1 })
      .lean();

    // Ensure all products have publicId (for backward compatibility)
    await addPublicIdsToProducts(products);

    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Szerver hiba a termékek lekérésekor" });
  }
});

/**
 * GET /api/products/user/:username
 * Retrieves all products created by a specific user
 * Must be before :identifier route to avoid route conflicts
 */
router.get("/products/user/:username", async (req, res) => {
  try {
    // Find all products created by the specified user
    const products = await Products_model.find({
      createdBy: req.params.username,
    })
      .sort({ createdAt: -1 })
      .lean();

    if (!products || products.length === 0) {
      return res.json([]);
    }

    // Ensure all products have publicId
    await addPublicIdsToProducts(products);

    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Szerver hiba a termékek lekérésekor" });
  }
});

/**
 * GET /api/products/:identifier
 * Retrieves a single product by publicId or _id
 * First tries publicId lookup, then falls back to _id for compatibility
 */
router.get("/products/:identifier", async (req, res) => {
  try {
    // Try to find by publicId first
    let product = await Products_model.findOne({
      publicId: req.params.identifier,
    }).lean();

    // Fallback: try to find by _id for old links
    if (!product) {
      try {
        product = await Products_model.findById(req.params.identifier).lean();
      } catch (e) {
        // Invalid ObjectId format - ignore
      }
    }

    if (!product) {
      return res.status(404).json({ error: "Termék nem található" });
    }

    // Ensure publicId exists
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

/**
 * POST /api/products
 * Creates a new product listing
 * Requires authentication. User becomes the product creator.
 * Accepts either single imageUrl or multiple images array
 */
router.post("/products", authMiddleware, async (req, res) => {
  try {
    const { productName, description, location, price, imageUrl, images } =
      req.body;
    const username = req.user.username;

    // Validate required fields
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

    if (productName.length < 3) {
      return res.status(400).json({
        error: "A terméknév legalább 3 karakter hosszú legyen!",
      });
    }

    // Prepare images array (prefer images array if provided)
    const allImages =
      images && images.length > 0 ? images : imageUrl ? [imageUrl] : [];

    // Create new product document
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

    // Save to database
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

/**
 * PUT /api/products/:id
 * Updates an existing product
 * Only the product creator can update their own products
 */
router.put("/products/:id", authMiddleware, async (req, res) => {
  try {
    const { productName, description, location, price, imageUrl, images } =
      req.body;
    const username = req.user.username;

    // Fetch product
    const product = await Products_model.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ error: "Termék nem található" });
    }

    // Verify ownership
    if (product.createdBy !== username) {
      return res
        .status(403)
        .json({ error: "Nincs jogosultságod szerkeszteni ezt a terméket" });
    }

    // Validate required fields
    if (!productName || !description || !location || price === undefined) {
      return res.status(400).json({ error: "Hiányzó mezők" });
    }

    if (productName.length < 3) {
      return res.status(400).json({
        error: "A terméknév legalább 3 karakter hosszú legyen!",
      });
    }

    // Prepare update data
    const updateData = {
      productName: productName.trim(),
      description: description.trim(),
      location: location.trim(),
      price: parseFloat(price),
    };

    // Update images if provided
    if (images && images.length > 0) {
      updateData.images = images;
      updateData.imageUrl = images[0];
    } else if (imageUrl) {
      updateData.imageUrl = imageUrl.trim();
    }

    // Update product in database
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

/**
 * DELETE /api/products/:id
 * Deletes a product
 * Only the product creator can delete their own products
 */
router.delete("/products/:id", authMiddleware, async (req, res) => {
  try {
    const username = req.user.username;

    // Fetch product
    const product = await Products_model.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ error: "Termék nem található" });
    }

    // Verify ownership
    if (product.createdBy !== username) {
      return res
        .status(403)
        .json({ error: "Nincs jogosultságod törölni ezt a terméket" });
    }

    // Delete product from database
    await Products_model.findByIdAndDelete(req.params.id);

    res.json({ message: "Termék sikeresen törölve", productId: req.params.id });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ error: "Szerver hiba a termék törlésénél" });
  }
});

module.exports = router;
