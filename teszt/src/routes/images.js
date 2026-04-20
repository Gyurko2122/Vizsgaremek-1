/**
 * @file Image Routes and Handlers
 * @description Endpoints for uploading and serving images stored in MongoDB
 */

const express = require("express");
const multer = require("multer");
const { Image_model, Users_model, Products_model } = require("../database");
const { authMiddleware } = require("../middleware/auth");
const { createImageFilter, ensurePublicId } = require("../utils/imageHelper");

const router = express.Router();

// Configure multer for memory storage
const uploadProfilePic = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: createImageFilter(),
});

const uploadProductImg = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: createImageFilter(),
});

/**
 * Multer error handling wrapper for single file uploads
 * Catches multer errors and passes them to error handler
 * @param {Object} uploader - Multer uploader instance
 * @returns {Function} Middleware function
 */
const uploadErrorHandler = (uploader) => {
  return (req, res, next) => {
    uploader(req, res, (err) => {
      if (err) {
        console.error("Multer error:", err);
        return res
          .status(400)
          .json({ error: err.message || "Kép feltöltési hiba" });
      }
      next();
    });
  };
};

/**
 * GET /api/images/:identifier
 * Retrieves image from MongoDB by publicId or falls back to _id
 * Returns image with proper MIME type and cache headers
 * @param {string} identifier - publicId or _id of the image
 */
router.get("/images/:identifier", async (req, res) => {
  try {
    // Try to find by publicId first
    let image = await Image_model.findOne({
      publicId: req.params.identifier,
    });

    // Fallback: try to find by _id for old records
    if (!image) {
      try {
        image = await Image_model.findById(req.params.identifier);
      } catch (e) {
        // Invalid ObjectId format - ignore
      }
    }

    if (!image) {
      return res.status(404).json({ error: "Kép nem található" });
    }

    // Set response headers for image serving
    res.set("Content-Type", image.contentType);
    res.set("Cache-Control", "public, max-age=86400"); // 24-hour cache
    res.send(image.data);
  } catch (error) {
    console.error("Error serving image:", error);
    res.status(500).json({ error: "Szerver hiba" });
  }
});

/**
 * POST /api/upload/profile-picture
 * Uploads and stores user profile picture in MongoDB
 * Updates user's picture URL in database
 */
router.post(
  "/upload/profile-picture",
  authMiddleware,
  uploadErrorHandler(uploadProfilePic.single("file")),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Nincs file feltöltve" });
      }

      const username = req.user.username;

      // Save image to MongoDB
      const newImage = new Image_model({
        data: req.file.buffer,
        contentType: req.file.mimetype,
        filename: req.file.originalname,
      });
      const savedImage = await newImage.save();
      const imageUrl = `/api/images/${savedImage.publicId}`;

      // Update user's picture URL in database
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

/**
 * POST /api/upload/product-image
 * Uploads and stores a single product image in MongoDB
 * Used for uploading one image at a time
 */
router.post(
  "/upload/product-image",
  authMiddleware,
  uploadErrorHandler(uploadProductImg.single("file")),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Nincs file feltöltve" });
      }

      // Save image to MongoDB
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

/**
 * POST /api/upload/product-images
 * Uploads and stores multiple product images in MongoDB at once
 * Allows batch image upload up to 10 images per request
 */
router.post(
  "/upload/product-images",
  authMiddleware,
  uploadErrorHandler(uploadProductImg.array("files", 10)),
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: "Nincsenek fájlok feltöltve" });
      }

      // Save all images to MongoDB
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

module.exports = router;
