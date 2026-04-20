/**
 * @file NoSQL Injection Protection Middleware
 * @description Sanitizes request parameters and body to prevent NoSQL injection attacks
 */

/**
 * Sanitizes a value to prevent NoSQL injection
 * Recursively processes strings, arrays, and objects
 * Removes properties that start with "$" or contain "."
 * @param {any} val - The value to sanitize
 * @returns {any} Sanitized value
 */
function sanitizeValue(val) {
  if (typeof val === "string") return val;

  if (Array.isArray(val)) return val.map(sanitizeValue);

  if (val && typeof val === "object") {
    const clean = {};
    for (const key of Object.keys(val)) {
      // Skip potentially dangerous keys (MongoDB operators and nested properties)
      if (key.startsWith("$") || key.includes(".")) continue;
      clean[key] = sanitizeValue(val[key]);
    }
    return clean;
  }

  return val;
}

/**
 * Express middleware for sanitizing all incoming request data
 * Applied to req.body and req.params to prevent NoSQL injection
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const sanitizationMiddleware = (req, res, next) => {
  if (req.body) req.body = sanitizeValue(req.body);
  if (req.params) req.params = sanitizeValue(req.params);
  next();
};

module.exports = {
  sanitizationMiddleware,
  sanitizeValue,
};
