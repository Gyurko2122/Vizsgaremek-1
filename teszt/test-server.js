console.log("🔧 Test Server - Starting");

try {
  console.log("1️⃣ Loading modules...");
  const express = require("express");
  console.log("✓ express loaded");

  const cors = require("cors");
  console.log("✓ cors loaded");

  const path = require("path");
  console.log("✓ path loaded");

  const multer = require("multer");
  console.log("✓ multer loaded");

  const fs = require("fs");
  console.log("✓ fs loaded");

  const login = require("./src/login");
  console.log("✓ login loaded");

  const register = require("./src/register");
  console.log("✓ register loaded");

  const { Users_model, Products_model } = require("./src/database");
  console.log("✓ database loaded");

  console.log("2️⃣ Creating Express app...");
  const app = express();
  const PORT = 3000;

  console.log("3️⃣ Setting up middleware...");
  app.use(cors());
  app.use(express.json());

  console.log("4️⃣ Starting server...");
  app.listen(PORT, () => {
    console.log(`✅ Server started on http://localhost:${PORT}`);
  });
} catch (error) {
  console.error("❌ Error startingserver:", error.message);
  console.error(error.stack);
  process.exit(1);
}

// Keep process alive
setTimeout(() => {
  console.log("Still running...");
}, 5000);
