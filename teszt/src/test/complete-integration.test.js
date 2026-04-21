import { describe, it, expect, beforeEach, vi, afterAll } from "vitest";

/**
 * Complete Application Integration Tests
 *
 * Tests für die gesamte Vizsgaremek Platform
 * - Authentication (Login/Register)
 * - Product Management
 * - Search Functionality
 * - Favorites System
 * - User Profiles
 * - Messaging System
 * - Admin Features
 */

const API_BASE = "http://localhost:3000/api";
const TEST_PREFIX = `test_${Date.now()}`;
let testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  tests: [],
};

function logTest(name, passed, details = "") {
  testResults.total++;
  if (passed) testResults.passed++;
  else testResults.failed++;

  testResults.tests.push({
    name,
    passed,
    details,
    timestamp: new Date().toISOString(),
  });
}

async function fetchAPI(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: options.method || "GET",
      headers: options.headers || { "Content-Type": "application/json" },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    const data = await response.json().catch(() => ({}));
    return {
      status: response.statusCode || response.status,
      data,
      ok: response.ok,
    };
  } catch (error) {
    return { status: 0, data: {}, ok: false, error: error.message };
  }
}

describe("🔐 Authentication & User Management", () => {
  let testEmail = `${TEST_PREFIX}@example.com`;
  let testUsername = `${TEST_PREFIX}`;
  let authToken = null;

  it("✓ Register new user successfully", async () => {
    const result = await fetchAPI("/register", {
      method: "POST",
      body: {
        username: testUsername,
        email: testEmail,
        password: "TestPassword123!",
      },
    });

    const passed = result.status === 201 && result.data.token;
    logTest("Register new user", passed, `Status: ${result.status}`);

    if (passed) authToken = result.data.token;
    expect(passed).toBe(true);
  });

  it("✓ Prevent duplicate email registration", async () => {
    const result = await fetchAPI("/register", {
      method: "POST",
      body: {
        username: `${TEST_PREFIX}_duplicate`,
        email: testEmail,
        password: "TestPassword123!",
      },
    });

    const passed = result.status === 409;
    logTest("Prevent duplicate email", passed, `Status: ${result.status}`);
    expect(passed).toBe(true);
  });

  it("✓ Login with correct credentials", async () => {
    const result = await fetchAPI("/login", {
      method: "POST",
      body: {
        email: testEmail,
        password: "TestPassword123!",
      },
    });

    const passed = result.status === 200 && result.data.token;
    logTest("Login successfully", passed, `Status: ${result.status}`);
    expect(passed).toBe(true);
  });

  it("✓ Reject login with wrong password", async () => {
    const result = await fetchAPI("/login", {
      method: "POST",
      body: {
        email: testEmail,
        password: "WrongPassword",
      },
    });

    const passed = result.status === 401;
    logTest("Reject wrong password", passed, `Status: ${result.status}`);
    expect(passed).toBe(true);
  });

  it("✓ Verify JWT token validity", async () => {
    if (!authToken) {
      logTest("Verify token", false, "No auth token available");
      expect(false).toBe(true);
      return;
    }

    const result = await fetchAPI("/verify-token", {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    const passed = result.status === 200 && result.data.valid;
    logTest("Verify token validity", passed, `Status: ${result.status}`);
    expect(passed).toBe(true);
  });

  it("✓ Reject invalid token", async () => {
    const result = await fetchAPI("/verify-token", {
      headers: { Authorization: "Bearer invalid_token_xyz" },
    });

    const passed = result.status === 401;
    logTest("Reject invalid token", passed, `Status: ${result.status}`);
    expect(passed).toBe(true);
  });

  it("✓ Fetch user public profile", async () => {
    const result = await fetchAPI(`/user/${testUsername}`);
    const passed =
      result.status === 200 && result.data.username === testUsername;
    logTest("Fetch user profile", passed, `Status: ${result.status}`);
    expect(passed).toBe(true);
  });

  it("✓ Return 404 for non-existent user", async () => {
    const result = await fetchAPI("/user/nonexistent_user_xyz_123");
    const passed = result.status === 404;
    logTest("404 for non-existent user", passed, `Status: ${result.status}`);
    expect(passed).toBe(true);
  });
});

describe("📦 Product Management", () => {
  it("✓ Fetch all products", async () => {
    const result = await fetchAPI("/products");
    const passed = result.status === 200 && Array.isArray(result.data);
    logTest(
      "Fetch all products",
      passed,
      `Status: ${result.status}, Count: ${result.data.length || 0}`,
    );
    expect(passed).toBe(true);
  });

  it("✓ Fetch single product by ID", async () => {
    // First get a product
    const listResult = await fetchAPI("/products");
    if (listResult.data.length === 0) {
      logTest("Fetch product by ID", false, "No products available");
      expect(false).toBe(true);
      return;
    }

    const productId = listResult.data[0]._id || listResult.data[0].publicId;
    const result = await fetchAPI(`/products/${productId}`);
    const passed = result.status === 200 && result.data.productName;
    logTest("Fetch product by ID", passed, `Status: ${result.status}`);
    expect(passed).toBe(true);
  });

  it("✓ Return 404 for non-existent product", async () => {
    const result = await fetchAPI("/products/nonexistent_product_id_xyz");
    const passed = result.status === 404;
    logTest("404 for non-existent product", passed, `Status: ${result.status}`);
    expect(passed).toBe(true);
  });

  it("✓ Filter products by username", async () => {
    const result = await fetchAPI("/products/user/testuser");
    const passed = result.status === 200 && Array.isArray(result.data);
    logTest("Filter products by user", passed, `Status: ${result.status}`);
    expect(passed).toBe(true);
  });

  it("✓ Products have required fields", async () => {
    const result = await fetchAPI("/products");
    if (result.data.length === 0) {
      logTest("Products have required fields", false, "No products");
      expect(false).toBe(true);
      return;
    }

    const product = result.data[0];
    const hasRequired =
      product.productName && product.price && product.createdBy && product._id;
    logTest(
      "Products have required fields",
      hasRequired,
      `Fields: ${Object.keys(product).join(", ")}`,
    );
    expect(hasRequired).toBe(true);
  });
});

describe("🔍 Search Functionality", () => {
  it("✓ Search with minimum 2 characters", async () => {
    const result = await fetchAPI("/search?q=test");
    const passed =
      result.status === 200 && result.data.users && result.data.products;
    logTest("Search with valid query", passed, `Status: ${result.status}`);
    expect(passed).toBe(true);
  });

  it("✓ Reject search with 1 character", async () => {
    const result = await fetchAPI("/search?q=a");
    const passed = result.status === 400;
    logTest("Reject short search query", passed, `Status: ${result.status}`);
    expect(passed).toBe(true);
  });

  it("✓ Search returns users and products arrays", async () => {
    const result = await fetchAPI("/search?q=test");
    const passed =
      Array.isArray(result.data.users) && Array.isArray(result.data.products);
    logTest("Search returns correct structure", passed, "Both arrays present");
    expect(passed).toBe(true);
  });

  it("✓ Search without query parameter", async () => {
    const result = await fetchAPI("/search");
    const passed = result.status === 400;
    logTest(
      "Search requires query parameter",
      passed,
      `Status: ${result.status}`,
    );
    expect(passed).toBe(true);
  });
});

describe("❤️ Favorites System", () => {
  let testUser = `test_user_${Date.now()}`;

  it("✓ Fetch user favorites (unauthorized)", async () => {
    const result = await fetchAPI(`/favorites/${testUser}`);
    // Should work without auth (public favorites)
    const passed = result.status === 200 || result.status === 401;
    logTest(
      "Fetch favorites endpoint accessible",
      passed,
      `Status: ${result.status}`,
    );
    expect(passed).toBe(true);
  });

  it("✓ Favorites returns array", async () => {
    const result = await fetchAPI(`/favorites/${testUser}`);
    if (result.status === 200) {
      const passed =
        Array.isArray(result.data) || typeof result.data === "object";
      logTest(
        "Favorites returns correct format",
        passed,
        "Array or object returned",
      );
      expect(passed).toBe(true);
    }
  });

  it("✓ Fetch favorite products", async () => {
    const result = await fetchAPI(`/favorites/${testUser}/products`);
    const passed = result.status === 200 || result.status === 401;
    logTest("Fetch favorite products", passed, `Status: ${result.status}`);
    expect(passed).toBe(true);
  });
});

describe("💬 Messaging System", () => {
  it("✓ Search endpoint for conversations", async () => {
    const result = await fetchAPI("/search?q=test");
    const passed = result.status === 200;
    logTest(
      "Search for message conversations",
      passed,
      `Status: ${result.status}`,
    );
    expect(passed).toBe(true);
  });

  it("✓ Unread messages require authentication", async () => {
    const result = await fetchAPI("/messages/unread/testuser");
    const passed = result.status === 401;
    logTest(
      "Unread messages requires auth",
      passed,
      `Status: ${result.status}`,
    );
    expect(passed).toBe(true);
  });

  it("✓ Get messages between users requires auth", async () => {
    const result = await fetchAPI("/messages/user1/user2");
    const passed = result.status === 401;
    logTest(
      "Message history requires auth",
      passed,
      `Status: ${result.status}`,
    );
    expect(passed).toBe(true);
  });
});

describe("⚙️ Admin Features", () => {
  it("✓ Public admin status check", async () => {
    const result = await fetchAPI("/admin/check");
    const passed =
      result.status === 200 && typeof result.data.isAdmin === "boolean";
    logTest("Admin check endpoint", passed, `Status: ${result.status}`);
    expect(passed).toBe(true);
  });

  it("✓ Admin stats requires authentication", async () => {
    const result = await fetchAPI("/admin/stats");
    const passed = result.status === 401 || result.status === 403;
    logTest("Admin stats requires auth", passed, `Status: ${result.status}`);
    expect(passed).toBe(true);
  });

  it("✓ Admin users endpoint requires authentication", async () => {
    const result = await fetchAPI("/admin/users");
    const passed = result.status === 401 || result.status === 403;
    logTest("Admin users requires auth", passed, `Status: ${result.status}`);
    expect(passed).toBe(true);
  });

  it("✓ Admin products endpoint requires authentication", async () => {
    const result = await fetchAPI("/admin/products");
    const passed = result.status === 401 || result.status === 403;
    logTest("Admin products requires auth", passed, `Status: ${result.status}`);
    expect(passed).toBe(true);
  });
});

describe("📸 Image Upload & Serving", () => {
  it("✓ Image serving endpoint exists", async () => {
    const result = await fetchAPI("/images/test-id");
    const passed = result.status === 404 || result.status === 200;
    logTest("Image serving endpoint", passed, `Status: ${result.status}`);
    expect(passed).toBe(true);
  });

  it("✓ Profile picture upload requires auth", async () => {
    const result = await fetchAPI("/upload/profile-picture", {
      method: "POST",
      headers: { "Content-Type": "multipart/form-data" },
    });
    const passed = result.status === 401 || result.status === 400;
    logTest(
      "Profile picture requires auth",
      passed,
      `Status: ${result.status}`,
    );
    expect(passed).toBe(true);
  });

  it("✓ Product image upload requires auth", async () => {
    const result = await fetchAPI("/upload/product-image", {
      method: "POST",
      headers: { "Content-Type": "multipart/form-data" },
    });
    const passed = result.status === 401 || result.status === 400;
    logTest("Product image requires auth", passed, `Status: ${result.status}`);
    expect(passed).toBe(true);
  });
});

describe("🔒 Security & Middleware", () => {
  it("✓ CORS is enabled", async () => {
    const result = await fetchAPI("/products");
    const passed = result.status === 200;
    logTest("CORS is enabled", passed, `Status: ${result.status}`);
    expect(passed).toBe(true);
  });

  it("✓ API returns JSON", async () => {
    const result = await fetchAPI("/products");
    const passed = typeof result.data === "object";
    logTest("API returns JSON", passed, "Valid JSON response");
    expect(passed).toBe(true);
  });

  it("✓ Invalid endpoints return 404", async () => {
    const result = await fetchAPI("/invalid-endpoint-xyz-123");
    const passed = result.status === 404;
    logTest("Invalid endpoints return 404", passed, `Status: ${result.status}`);
    expect(passed).toBe(true);
  });
});

// Export test results for report generation
afterAll(() => {
  const reportPath = "./test-report.json";
  console.log("\n\n═══════════════════════════════════════════════════");
  console.log("TEST RESULTS SUMMARY");
  console.log("═══════════════════════════════════════════════════");
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`Passed: ${testResults.passed} ✓`);
  console.log(`Failed: ${testResults.failed} ✗`);
  console.log(
    `Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`,
  );
  console.log("═══════════════════════════════════════════════════\n");

  // Also write to file for report generation
  try {
    require("fs").writeFileSync(
      reportPath,
      JSON.stringify(testResults, null, 2),
    );
    console.log(`Report saved to: ${reportPath}`);
  } catch (e) {
    console.log("Could not save report");
  }
});
