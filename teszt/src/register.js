const express = require("express");
const bcrypt = require("bcryptjs");
const { Users_model } = require("./database");
const router = express.Router();
const { sendEmail } = require("./emailsender");

require("dotenv").config();

router.post("/register", async (req, res) => {
  try {
    console.log("req.body:", req.body);
    const username = req.body?.username;
    const email = req.body?.email;
    const password = req.body?.password;

    if (!username || !email || !password) {
      return res.status(400).json({
        message: "Hiányzó mezők: username, email, password szükséges.",
      });
    }

    // Ellenőrizze, hogy az email vagy username már létezik-e
    const existingUser = await Users_model.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return res
          .status(409)
          .json({ message: "Ezzel az emailel már regisztráltak!" });
      }
      if (existingUser.username === username) {
        return res
          .status(409)
          .json({ message: "Ez a felhasználónév már foglalt!" });
      }
    }

    // Jelszó hashelése és új felhasználó mentése
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new Users_model({
      username: username,
      email: email,
      password: hashedPassword,
      isAdmin: false,
    });

    const savedUser = await newUser.save();
    console.log("Felhasználó sikeresen mentve:", savedUser);

    // Email küldés (nem kritikus, ha sikertelen)
    try {
      await sendEmail(email);
    } catch (emailError) {
      console.warn("Email küldési hiba (nem kritikus):", emailError);
    }

    return res
      .status(201)
      .json({ message: "Sikeres regisztráció!", username: username });
  } catch (error) {
    console.error("Hiba a felhasználó mentése során:", error);
    return res
      .status(500)
      .json({ message: "Hiba a felhasználó mentése során." });
  }
});

module.exports = router;
