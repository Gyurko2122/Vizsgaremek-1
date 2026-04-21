import { vi } from "vitest";

/**
 * Mock API response builder
 */
export const mockFetch = (response, options = {}) => {
  const {
    status = 200,
    ok = status >= 200 && status < 300,
    headers = { "Content-Type": "application/json" },
  } = options;

  return Promise.resolve({
    ok,
    status,
    headers,
    json: () => Promise.resolve(response),
  });
};

/**
 * Reset all fetch mocks
 */
export const resetFetchMocks = () => {
  global.fetch.mockClear();
};

/**
 * Setup successful login mock
 */
export const mockLoginSuccess = () => {
  global.fetch.mockResolvedValueOnce({
    ok: true,
    status: 200,
    json: () =>
      Promise.resolve({
        username: "testuser",
        token: "test-jwt-token-12345",
        isAdmin: false,
      }),
  });
};

/**
 * Setup failed login mock (invalid credentials)
 */
export const mockLoginFailure = (message = "Hibás email vagy jelszó") => {
  global.fetch.mockResolvedValueOnce({
    ok: false,
    status: 401,
    json: () =>
      Promise.resolve({
        message,
      }),
  });
};

/**
 * Setup suspended user mock
 */
export const mockLoginSuspended = (days = 3) => {
  global.fetch.mockResolvedValueOnce({
    ok: false,
    status: 403,
    json: () =>
      Promise.resolve({
        message: "A felhasználód ideiglenesen letiltva van",
        suspendedUntil: new Date(
          Date.now() + days * 24 * 60 * 60 * 1000,
        ).toISOString(),
        reason: "Szabályzat megsértése",
      }),
  });
};

/**
 * Setup successful registration mock
 */
export const mockRegisterSuccess = () => {
  global.fetch.mockResolvedValueOnce({
    ok: true,
    status: 201,
    json: () =>
      Promise.resolve({
        message: "Sikeres regisztráció!",
        username: "newuser",
        token: "test-jwt-token-54321",
      }),
  });
};

/**
 * Setup registration failure mock (email already exists)
 */
export const mockRegisterFailure = (
  message = "Ez az email már használatban van",
) => {
  global.fetch.mockResolvedValueOnce({
    ok: false,
    status: 409,
    json: () =>
      Promise.resolve({
        message,
      }),
  });
};

/**
 * Setup token verification mock
 */
export const mockTokenVerification = (valid = true, user = {}) => {
  global.fetch.mockResolvedValueOnce({
    ok: valid,
    status: valid ? 200 : 401,
    json: () =>
      Promise.resolve({
        valid,
        username: user.username || "testuser",
        isAdmin: user.isAdmin || false,
      }),
  });
};

/**
 * Setup product list mock
 */
export const mockProductsList = (products = []) => {
  global.fetch.mockResolvedValueOnce({
    ok: true,
    status: 200,
    json: () => Promise.resolve(products),
  });
};

/**
 * Setup single product mock
 */
export const mockProductDetail = (product = {}) => {
  const defaultProduct = {
    _id: "507f1f77bcf86cd799439011",
    productName: "Test Product",
    description: "A test product",
    location: "Budapest",
    price: 5000,
    createdBy: "testuser",
    images: [],
    createdAt: new Date().toISOString(),
  };

  global.fetch.mockResolvedValueOnce({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ ...defaultProduct, ...product }),
  });
};
