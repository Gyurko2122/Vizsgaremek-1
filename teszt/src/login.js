const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Users_model } = require("./database");
const router = express.Router();
require("dotenv").config();

const JWT_SECRET = (() => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.warn(
      "⚠️  JWT_SECRET nincs beállítva a .env fájlban! Állítsd be production környezetben!",
    );
    return require("crypto")
      .createHash("sha256")
      .update("piacter-default-jwt-secret-change-in-production")
      .digest("hex");
  }
  return secret;
})();

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await Users_model.findOne({ email: email });
  if (!user) {
    return res
      .status(401)
      .json({ message: "Hibás!", error: "Nem létező felhasználó" });
  }
  const isPasswordCorrect = await bcrypt.compare(password, user.password);
  const isEmailCorrerct = email === user.email;
  if (isPasswordCorrect && isEmailCorrerct) {
    // Felfüggesztés ellenőrzése
    if (user.suspendedUntil && new Date(user.suspendedUntil) > new Date()) {
      const until = new Date(user.suspendedUntil).toLocaleDateString("hu-HU");
      const reason = user.suspensionReason || "Nincs megadva ok";
      return res.status(403).json({
        message: `A fiókod fel van függesztve ${until}-ig.`,
        reason: reason,
        suspendedUntil: user.suspendedUntil,
      });
    }
    // Ha lejárt a felfüggesztés, töröljük
    if (user.suspendedUntil && new Date(user.suspendedUntil) <= new Date()) {
      user.suspendedUntil = null;
      user.suspensionReason = null;
      await user.save();
    }
    res.status(200).json({
      message: "Sikeres bejelentkezés!",
      username: user.username,
      isAdmin: user.isAdmin || false,
      token: jwt.sign(
        { username: user.username, isAdmin: user.isAdmin || false },
        JWT_SECRET,
        { expiresIn: "7d" },
      ),
    });
  } else {
    res.status(401).json({ message: "Hibás e-mail cím vagy jelszó!" });
  }
});

module.exports = router;
module.exports.JWT_SECRET = JWT_SECRET;
