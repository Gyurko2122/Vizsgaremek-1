// Auth token helper functions
export function getAuthToken() {
  const rememberMe = localStorage.getItem("rememberMe") === "true";
  return rememberMe
    ? localStorage.getItem("authToken")
    : sessionStorage.getItem("authToken");
}

export function setAuthToken(token, rememberMe) {
  if (rememberMe) {
    localStorage.setItem("authToken", token);
    console.log(
      "✅ Token saved to localStorage:",
      token.substring(0, 20) + "...",
    );
  } else {
    sessionStorage.setItem("authToken", token);
    console.log(
      "✅ Token saved to sessionStorage:",
      token.substring(0, 20) + "...",
    );
  }
}

export function clearAuthToken() {
  localStorage.removeItem("authToken");
  sessionStorage.removeItem("authToken");
}

export function authHeaders(contentType = "application/json") {
  const token = getAuthToken();
  const headers = {};
  if (contentType) headers["Content-Type"] = contentType;
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

// For file uploads (no Content-Type, let browser set it)
export function authHeadersMultipart() {
  const token = getAuthToken();
  const headers = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}
