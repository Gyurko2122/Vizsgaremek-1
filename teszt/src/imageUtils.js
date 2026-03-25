/**
 * Image Utility Functions
 * Segédfunkciók a képek kezeléséhez és optimalizálásához
 */

/**
 * Cache-busting URL generálás
 * @param {string} baseUrl - Az alapvető URL (pl. /uploads/profile-pictures/image.jpg)
 * @returns {string} - URL query paraméterrel (versió/timestamp)
 */
function addCacheBust(baseUrl) {
  if (!baseUrl) return baseUrl;

  // Ha már van query paraméter, módosítsd
  if (baseUrl.includes("?")) {
    const [url, params] = baseUrl.split("?");
    return `${url}?v=${Date.now()}&${params}`;
  }

  // Egyéb esetben add query string-et
  return `${baseUrl}?v=${Date.now()}`;
}

/**
 * Kép URL validálása
 * @param {string} url - Az ellenőrizendő URL
 * @returns {boolean} - Érvényes-e az URL
 */
function isValidImageUrl(url) {
  if (!url || typeof url !== "string") return false;

  try {
    const urlObj = new URL(
      url,
      typeof window !== "undefined"
        ? window.location.origin
        : "http://localhost",
    );
    const validExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
    return validExtensions.some((ext) =>
      urlObj.pathname.toLowerCase().endsWith(ext),
    );
  } catch (e) {
    return false;
  }
}

/**
 * Placeholder/fallback kép generálása
 * @param {string} text - Megjelenítendő szöveg
 * @param {number} width - Szélesség pixelben
 * @param {number} height - Magasság pixelben
 * @returns {string} - SVG data URL
 */
function generatePlaceholderImage(
  text = "Kép nem elérhető",
  width = 300,
  height = 300,
) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}'>
    <rect fill='%23ddd' width='${width}' height='${height}'/>
    <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' 
          font-family='Arial' font-size='${Math.max(14, width / 20)}' fill='%23666'>
      ${text}
    </text>
  </svg>`;

  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}'%3E%3Crect fill='%23ddd' width='${width}' height='${height}'/%3E%3Ctext x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='18' fill='%23666'%3E${encodeURIComponent(text)}%3C/text%3E%3C/svg%3E`;
}

/**
 * Kép optimalizálás paraméter hozzáadása
 * Cloudinary vagy hasonló szolgáltatás számára
 * @param {string} url - Az eredeti kép URL
 * @param {Object} options - Optimalizálási beállítások
 * @returns {string} - Optimalizált URL
 */
function optimizeImageUrl(url, options = {}) {
  const {
    width = null,
    height = null,
    quality = 80,
    format = "auto",
  } = options;

  // Ha a kép már optimalizált URL-t tartalmaz, ne módosítsd
  if (url.includes("?")) {
    return url;
  }

  // Egyszerű param hozzáadása
  const params = new URLSearchParams();
  if (width) params.append("w", width);
  if (height) params.append("h", height);
  params.append("q", quality);
  params.append("f", format);

  return `${url}?${params.toString()}`;
}

module.exports = {
  addCacheBust,
  isValidImageUrl,
  generatePlaceholderImage,
  optimizeImageUrl,
};
