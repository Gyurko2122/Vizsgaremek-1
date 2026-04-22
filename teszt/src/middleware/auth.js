/**
 * @file Authentication and Authorization Middleware
 * @description Middleware functions for JWT token validation and admin role checking
 */

const jwt = require("jsonwebtoken");
const { Users_model } = require("../database");
const { JWT_SECRET } = require("../login");

/**
 * JWT Authentication Middleware
 * Validates the Bearer token in the Authorization header and extracts user data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void} Sets req.user with decoded token data if valid
 */
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers["authorization"];

  // Check if Authorization header exists and starts with "Bearer "
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ error: "Nincs bejelentkezve (hiányzó token)" });
  }

  // Extract token from "Bearer <token>"
  const token = authHeader.split(" ")[1];

  try {
    // Verify and decode JWT token
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { username, isAdmin }
    next();
  } catch (err) {
    return res.status(401).json({ error: "Érvénytelen vagy lejárt token" });
  }
};

/**
 * Admin Authorization Middleware
 * Validates JWT token AND checks if user has admin privileges
 * Must be used after authMiddleware or independently to verify admin role
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void} Sets req.adminUser with admin user data if authorized
 */
const isAdminMiddleware = async (req, res, next) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Nincs bejelentkezve" });
  }

  const token = authHeader.split(" ")[1];

  try {
    // Decode JWT token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Query database to verify admin status
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

module.exports = {
  authMiddleware,
  isAdminMiddleware,
};
