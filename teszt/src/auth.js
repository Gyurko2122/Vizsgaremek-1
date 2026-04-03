// Auth helper functions
// A token most HttpOnly cookie-ban van tárolva, JavaScript nem fér hozzá.
// A böngésző automatikusan küldi same-origin kéréseknél.

export function setAuthToken() {
  // No-op: a token HttpOnly cookie-ban van, a szerver állítja be
}

export function clearAuthToken() {
  // Régi tokenek törlése (backward compatibility)
  localStorage.removeItem("authToken");
  sessionStorage.removeItem("authToken");
}

export function authHeaders(contentType = "application/json") {
  const headers = {};
  if (contentType) headers["Content-Type"] = contentType;
  return headers;
}

// For file uploads (no Content-Type, let browser set it)
export function authHeadersMultipart() {
  return {};
}
