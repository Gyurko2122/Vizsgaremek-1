const express = require("express");
const bcrypt = require("bcryptjs");
const { Users_model } = require("./database");
const router = express.Router();
require("dotenv").config();

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
    res
      .status(200)
      .json({ message: "Sikeres bejelentkezés!", username: user.username });
  } else {
    res.status(401).json({ message: "Hibás e-mail cím vagy jelszó!" });
  }
});

module.exports = router;
