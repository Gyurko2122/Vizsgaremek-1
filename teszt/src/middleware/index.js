const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../login");
const { Users_model } = require("../database");

/**
 * NoSQL injection védelem - saját sanitize middleware
 * Express 5 kompatibilis
 */
function sanitizeValue(val) {
  if (typeof val === "string") return val;
  if (Array.isArray(val)) return val.map(sanitizeValue);
  if (val && typeof val === "object") {
    const clean = {};
    for (const key of Object.keys(val)) {
      if (key.startsWith("$") || key.includes(".")) continue;
      clean[key] = sanitizeValue(val[key]);
    }
    return clean;
  }
  return val;
}

/**
 * NoSQL injection védelem middleware
 */
const sanitizeMiddleware = (req, res, next) => {
  if (req.body) req.body = sanitizeValue(req.body);
  if (req.params) req.params = sanitizeValue(req.params);
  next();
};

/**
 * CSP header beállítása
 */
const csrfHeaderMiddleware = (req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self' https://vizsga-ic7v.onrender.com; img-src 'self' data: http: https:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self' http://localhost:3000 ws://localhost:3000 https://vizsga-ic7v.onrender.com wss://vizsga-ic7v.onrender.com; font-src 'self' data:",
  );
  next();
};

/**
 * JWT Auth Middleware
 * Cookie-ból VAGY header-ből olvassa a tokent
 */
const authMiddleware = (req, res, next) => {
  let token = req.cookies && req.cookies.token;
  if (!token) {
    const authHeader = req.headers["authorization"];
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }
  }
  if (!token) {
    return res
      .status(401)
      .json({ error: "Nincs bejelentkezve (hiányzó token)" });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { username, isAdmin }
    next();
  } catch (err) {
    return res.status(401).json({ error: "Érvénytelen vagy lejárt token" });
  }
};

/**
 * Admin jogosultság ellenőrzése
 * JWT alapú, cookie-ból VAGY header-ből
 */
const isAdminMiddleware = async (req, res, next) => {
  let token = req.cookies && req.cookies.token;
  if (!token) {
    const authHeader = req.headers["authorization"];
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }
  }
  if (!token) {
    return res.status(401).json({ error: "Nincs bejelentkezve" });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
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
  sanitizeValue,
  sanitizeMiddleware,
  csrfHeaderMiddleware,
  authMiddleware,
  isAdminMiddleware,
};
