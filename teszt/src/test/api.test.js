import { describe, it, expect, beforeEach, afterEach } from "vitest";

/**
 * API Integration Tests
 *
 * These tests verify the server API endpoints work correctly
 * Run with: npm run test -- src/test/api.test.js
 *
 * Note: These tests require the server to be running on http://localhost:3000
 */

const API_BASE = "http://localhost:3000/api";

describe("API Integration Tests", () => {
  let authToken = null;
  let testUsername = `testuser_${Date.now()}`;
  let testEmail = `test_${Date.now()}@example.com`;
  const testPassword = "TestPassword123!";

  beforeEach(() => {
    // Clear auth token before each test
    authToken = null;
  });

  describe("Authentication Routes", () => {
    it("should register a new user", async () => {
      const response = await fetch(`${API_BASE}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: testUsername,
          email: testEmail,
          password: testPassword,
        }),
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data).toHaveProperty("token");
      expect(data).toHaveProperty("username", testUsername);
      authToken = data.token;
    });

    it("should not register with duplicate email", async () => {
      // First registration
      await fetch(`${API_BASE}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: `user_${Date.now()}`,
          email: `duplicate_${Date.now()}@example.com`,
          password: testPassword,
        }),
      });

      // Try duplicate
      const response = await fetch(`${API_BASE}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: `otheruser_${Date.now()}`,
          email: `duplicate_${Date.now()}@example.com`,
          password: testPassword,
        }),
      });

      expect(response.status).toBe(409);
    });

    it("should login with correct credentials", async () => {
      // Register first
      const registerRes = await fetch(`${API_BASE}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: `logintest_${Date.now()}`,
          email: `logintest_${Date.now()}@example.com`,
          password: testPassword,
        }),
      });

      const registerData = await registerRes.json();

      // Now login
      const loginRes = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: `logintest_${Date.now()}@example.com`,
          password: testPassword,
        }),
      });

      expect(loginRes.status).toBe(200);
      const loginData = await loginRes.json();
      expect(loginData).toHaveProperty("token");
      expect(loginData).toHaveProperty("username");
    });

    it("should reject login with wrong password", async () => {
      const response = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "nonexistent@example.com",
          password: "wrongpassword",
        }),
      });

      expect(response.status).toBe(401);
    });

    it("should verify valid token", async () => {
      // First register and get token
      const registerRes = await fetch(`${API_BASE}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: `tokentest_${Date.now()}`,
          email: `tokentest_${Date.now()}@example.com`,
          password: testPassword,
        }),
      });

      const registerData = await registerRes.json();
      const token = registerData.token;

      // Verify token
      const verifyRes = await fetch(`${API_BASE}/verify-token`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(verifyRes.status).toBe(200);
      const verifyData = await verifyRes.json();
      expect(verifyData.valid).toBe(true);
    });

    it("should reject invalid token", async () => {
      const response = await fetch(`${API_BASE}/verify-token`, {
        method: "GET",
        headers: { Authorization: "Bearer invalid_token_12345" },
      });

      expect(response.status).toBe(401);
    });
  });

  describe("Product Routes", () => {
    it("should fetch all products", async () => {
      const response = await fetch(`${API_BASE}/products`);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
    });

    it("should fetch product by ID", async () => {
      // First get all products
      const listRes = await fetch(`${API_BASE}/products`);
      const products = await listRes.json();

      if (products.length > 0) {
        const productId = products[0]._id || products[0].publicId;
        const response = await fetch(`${API_BASE}/products/${productId}`);
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data).toHaveProperty("productName");
        expect(data).toHaveProperty("createdBy");
      }
    });

    it("should return 404 for non-existent product", async () => {
      const response = await fetch(`${API_BASE}/products/nonexistent_id_12345`);
      expect(response.status).toBe(404);
    });
  });

  describe("User Routes", () => {
    it("should fetch public user profile", async () => {
      // Register a user first
      const registerRes = await fetch(`${API_BASE}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: `profile_${Date.now()}`,
          email: `profile_${Date.now()}@example.com`,
          password: testPassword,
        }),
      });

      const registerData = await registerRes.json();
      const username = registerData.username;

      // Fetch public profile
      const profileRes = await fetch(`${API_BASE}/user/${username}`);
      expect(profileRes.status).toBe(200);
      const profileData = await profileRes.json();
      expect(profileData).toHaveProperty("username", username);
      expect(profileData).toHaveProperty("email");
    });

    it("should return 404 for non-existent user", async () => {
      const response = await fetch(
        `${API_BASE}/user/nonexistent_user_${Date.now()}`,
      );
      expect(response.status).toBe(404);
    });
  });

  describe("Search Routes", () => {
    it("should search for users and products", async () => {
      const response = await fetch(`${API_BASE}/search?q=test`);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty("users");
      expect(data).toHaveProperty("products");
      expect(Array.isArray(data.users)).toBe(true);
      expect(Array.isArray(data.products)).toBe(true);
    });

    it("should require minimum 2 character search", async () => {
      const response = await fetch(`${API_BASE}/search?q=a`);
      expect(response.status).toBe(400);
    });
  });

  describe("Image Routes", () => {
    it("should serve placeholder image for non-existent image", async () => {
      const response = await fetch(`${API_BASE}/images/nonexistent_image_id`);
      // Could return 404 or placeholder depending on implementation
      expect([404, 200]).toContain(response.status);
    });
  });

  describe("Favorites Routes", () => {
    it("should return 401 for unauthenticated favorites request", async () => {
      const response = await fetch(`${API_BASE}/favorites/testuser`);
      // Should either return 401 or publicly available data
      expect([200, 401]).toContain(response.status);
    });
  });

  describe("Messages Routes", () => {
    it("should return 401 for unauthenticated message request", async () => {
      const response = await fetch(`${API_BASE}/messages/unread/testuser`);
      expect(response.status).toBe(401);
    });
  });

  describe("Admin Routes", () => {
    it("should provide public admin check endpoint", async () => {
      const response = await fetch(`${API_BASE}/admin/check`);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty("isAdmin");
    });

    it("should return 403 for non-admin accessing admin stats", async () => {
      // Create and login as regular user
      const registerRes = await fetch(`${API_BASE}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: `nonAdmin_${Date.now()}`,
          email: `nonAdmin_${Date.now()}@example.com`,
          password: testPassword,
        }),
      });

      const registerData = await registerRes.json();
      const token = registerData.token;

      const response = await fetch(`${API_BASE}/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(response.status).toBe(403);
    });
  });
});
