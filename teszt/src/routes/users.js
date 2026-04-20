/**
 * @file User Routes
 * @description Endpoints for user profile operations, account deletion, and verification
 */

const express = require("express");
const jwt = require("jsonwebtoken");
const {
  Users_model,
  Products_model,
  Message_model,
  Favorite_model,
} = require("../database");
const { authMiddleware } = require("../middleware/auth");
const { JWT_SECRET } = require("../login");

const router = express.Router();

/**
 * GET /api/user/:username
 * Retrieves public user profile information
 * Returns username, email, profile picture, and account creation date
 */
router.get("/user/:username", async (req, res) => {
  try {
    const user = await Users_model.findOne({ username: req.params.username });

    if (!user) {
      return res.status(404).json({ error: "Felhasználó nem található" });
    }

    // Return only public user information
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

/**
 * GET /api/verify-token
 * Verifies JWT token validity and checks account status
 * Used for session restoration on page reload
 * Returns user info if token is valid and account is not suspended
 */
router.get("/verify-token", authMiddleware, async (req, res) => {
  try {
    const user = await Users_model.findOne({ username: req.user.username });

    if (!user) {
      return res
        .status(401)
        .json({ valid: false, error: "Felhasználó nem található" });
    }

    // Check if account is suspended
    if (user.suspendedUntil && new Date(user.suspendedUntil) > new Date()) {
      return res
        .status(403)
        .json({ valid: false, error: "Fiók felfüggesztve" });
    }

    // Return valid token response with user info
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

/**
 * DELETE /api/user/:username
 * Permanently deletes user account and all associated data
 * Requires username confirmation to prevent accidental deletion
 * Deletes: user profile, products, messages, and favorites
 */
router.delete("/user/:username", authMiddleware, async (req, res) => {
  try {
    const { username } = req.params;
    const { confirmUsername } = req.body;

    // Verify that only the user can delete their own account
    if (req.user.username !== username) {
      return res
        .status(403)
        .json({ error: "Nincs jogosultságod törölni ezt a fiókot" });
    }

    // Require username confirmation to prevent accidents
    if (!confirmUsername || confirmUsername !== username) {
      return res
        .status(400)
        .json({ error: "Felhasználónév megerősítés szükséges" });
    }

    const user = await Users_model.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: "Felhasználó nem található" });
    }

    // Delete all user's products
    await Products_model.deleteMany({ createdBy: username });

    // Delete all user's favorites
    await Favorite_model.deleteMany({ user: user._id });

    // Delete all user's messages
    await Message_model.deleteMany({
      $or: [{ fromUser: username }, { toUser: username }],
    });

    // Delete the user account
    await Users_model.findByIdAndDelete(user._id);

    res.json({ message: "Fiók sikeresen törölve" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Szerver hiba a fiók törlésénél" });
  }
});

module.exports = router;
