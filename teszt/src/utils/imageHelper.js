/**
 * @file Image Utility Functions
 * @description Helper functions for image handling, publicId generation, and image operations
 */

const crypto = require("crypto");

/**
 * Ensures a document has a publicId, generating one if necessary
 * Used for backward compatibility with old records that don't have publicId
 * @param {Object} doc - The document object
 * @param {Object} Model - The Mongoose model to update
 * @returns {Promise<Object>} The document with publicId ensured
 */
async function ensurePublicId(doc, Model) {
  if (!doc.publicId) {
    // Generate a random 16-byte hex string as publicId
    doc.publicId = crypto.randomBytes(16).toString("hex");
    // Save the generated publicId to the database
    await Model.findByIdAndUpdate(doc._id, { publicId: doc.publicId });
  }
  return doc;
}

/**
 * Validates image MIME types
 * Checks if the uploaded file is in the list of allowed image formats
 * @param {string} mimetype - The MIME type of the file
 * @returns {boolean} True if MIME type is allowed, false otherwise
 */
function isValidImageMimeType(mimetype) {
  const allowedMimes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  return allowedMimes.includes(mimetype);
}

/**
 * Creates a multer image filter function
 * Used with multer to validate uploaded files before saving
 * @returns {Function} Filter function for multer
 */
function createImageFilter() {
  return (req, file, cb) => {
    if (isValidImageMimeType(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Csak képfájlok engedélyezve (jpg, png, gif, webp)"));
    }
  };
}

module.exports = {
  ensurePublicId,
  isValidImageMimeType,
  createImageFilter,
};
