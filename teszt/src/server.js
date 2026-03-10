const express = require("express");
const cors = require("cors");
const path = require("path");
const login = require("./login");
const register = require("./register");
const app = express();
const PORT = 3000;

// --- Middleware Beállítások ---
app.use(cors());
app.use(express.json());

// CSP Header beállítása - engedékeny biztonsági politika
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; img-src 'self' data: http: https:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' 'unsafe-eval'"
  );
  next();
});

app.use(express.static("public"));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.use("/api", register);
app.use("/api", login);
// app.use(favicon(path.join(__dirname, "../public", "favicon.ico")));

app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "src", "AuthPage.jsx"));
});

app.get("/profile", (req, res) => {
  res.sendFile(path.join(__dirname, "../public", "profile-page.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

// --- Szerver Indítása ---
app.listen(PORT, () => {
  console.log(`✅ A Piactér szerver fut a http://localhost:${PORT} címen`);
});
