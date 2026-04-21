import "@testing-library/jest-dom";
import { expect, afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

// Cleanup after each test
afterEach(() => {
  cleanup();
  try {
    localStorage.clear();
  } catch (e) {
    // localStorage might not be available
  }
  try {
    sessionStorage.clear();
  } catch (e) {
    // sessionStorage might not be available
  }
});

// Note: Fetch is NOT mocked globally to allow API integration tests to work
// Component tests mock fetch locally as needed
// Store original fetch for API tests
const originalFetch = global.fetch;

// Create a mock fetch that can be used by component tests
global.fetch = vi.fn();
global.fetch._original = originalFetch;

// Mock localStorage and sessionStorage for tests
const createLocalStorageMock = () => {
  const store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach((key) => {
        delete store[key];
      });
    },
  };
};

global.localStorage = createLocalStorageMock();
global.sessionStorage = createLocalStorageMock();

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock window.history.pushState
window.history.pushState = vi.fn();
