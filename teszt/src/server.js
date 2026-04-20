/**
 * @file Main Server File
 * @description Express server with Socket.io for real-time messaging
 * Modularized routes and middleware for better maintainability
 */

const express = require("express");
const cors = require("cors");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

// Import middleware
const { sanitizationMiddleware } = require("./middleware/sanitization");
const { securityHeadersMiddleware } = require("./middleware/security");

// Import Socket.io handlers
const { initializeSocketHandlers } = require("./socketHandlers/messageHandler");

// Import routes
const loginRouter = require("./login");
const registerRouter = require("./register");
const userRoutes = require("./routes/users");
const productRoutes = require("./routes/products");
const messageRoutes = require("./routes/messages");
const favoriteRoutes = require("./routes/favorites");
const adminRoutes = require("./routes/admin");
const imageRoutes = require("./routes/images");

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.io with CORS configuration
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Set up Socket.io event handlers for real-time messaging
initializeSocketHandlers(io);

const PORT = process.env.PORT || 3000;

console.log("Server.js - Starting initialization...");

// --- Middleware Configuration ---

// Enable CORS for cross-origin requests
app.use(cors());

// Parse JSON request bodies
app.use(express.json());

// Sanitize all input data to prevent NoSQL injection
app.use(sanitizationMiddleware);

// Enable trust proxy for deployment behind load balancers
app.set("trust proxy", 1);

// Set security headers (CSP, etc.)
app.use(securityHeadersMiddleware);

// Serve static files from dist directory (React build)
app.use(express.static(path.join(__dirname, "../dist")));

// --- Mount Authentication Routes ---
app.use("/api", registerRouter);
app.use("/api", loginRouter);

// --- Mount API Routes ---
app.use("/api", userRoutes);
app.use("/api", productRoutes);
app.use("/api", messageRoutes);
app.use("/api", favoriteRoutes);
app.use("/api", adminRoutes);
app.use("/api", imageRoutes);

// --- SPA Fallback Route ---
/**
 * Serves index.html for any unmatched routes (React Router)
 * Excludes /api/ and /uploads/ paths to avoid serving HTML for API calls
 */
app.use((req, res, next) => {
  if (req.path.startsWith("/api/") || req.path.startsWith("/uploads/")) {
    return res.status(404).json({ error: "Nem található" });
  }
  res.sendFile(path.join(__dirname, "../dist/index.html"));
});

// --- Server Startup ---
/**
 * Start the Express server with Socket.io support
 * Listens on the configured PORT (default: 3000)
 */
server.listen(PORT, () => {
  console.log(`✅ A Piactér szerver fut a http://localhost:${PORT} címen`);
  console.log("Server.js - Initialization complete!");
});
