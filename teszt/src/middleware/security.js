/**
 * @file Security Headers Middleware
 * @description Sets Content Security Policy and other security-related headers
 */

/**
 * Middleware to set CSP (Content Security Policy) headers
 * Configures allowed sources for scripts, styles, images, fonts, and connections
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const securityHeadersMiddleware = (req, res, next) => {
  // Set Content Security Policy to protect against XSS and injection attacks
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self' https://vizsga-ic7v.onrender.com; " +
      "img-src 'self' data: http: https:; " +
      "style-src 'self' 'unsafe-inline'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
      "connect-src 'self' http://localhost:3000 ws://localhost:3000 " +
      "https://vizsga-ic7v.onrender.com wss://vizsga-ic7v.onrender.com; " +
      "font-src 'self' data:",
  );
  next();
};

module.exports = {
  securityHeadersMiddleware,
};
