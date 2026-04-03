const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { Users_model } = require("./database");
const router = express.Router();
require("dotenv").config();

const JWT_SECRET = (() => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      console.error("❌ FATAL: JWT_SECRET nincs beállítva production környezetben!");
      process.exit(1);
    }
    console.warn(
      "⚠️  JWT_SECRET nincs beállítva! Véletlen kulcs generálva (csak fejlesztéshez).",
    );
    return crypto.randomBytes(64).toString("hex");
  }
  return secret;
})();

router.post("/login", async (req, res) => {
  const { email, password, rememberMe } = req.body;

  // NoSQL injection védelem - csak string típust fogadunk el
  if (typeof email !== "string" || typeof password !== "string") {
    return res.status(400).json({ message: "Érvénytelen bemenet" });
  }

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
    const tokenExpiry = rememberMe ? "7d" : "2h";
    const token = jwt.sign(
      { username: user.username, isAdmin: user.isAdmin || false },
      JWT_SECRET,
      { expiresIn: tokenExpiry },
    );

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    };
    if (rememberMe) {
      cookieOptions.maxAge = 7 * 24 * 60 * 60 * 1000; // 7 nap
    }
    // session cookie (no maxAge) ha nem rememberMe

    res.cookie("token", token, cookieOptions);
    res.status(200).json({
      message: "Sikeres bejelentkezés!",
      username: user.username,
      isAdmin: user.isAdmin || false,
    });
  } else {
    res.status(401).json({ message: "Hibás e-mail cím vagy jelszó!" });
  }
});

module.exports = router;
module.exports.JWT_SECRET = JWT_SECRET;
