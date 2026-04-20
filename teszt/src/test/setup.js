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

// Mock fetch globally
global.fetch = vi.fn();

// Setup localStorage if not available
if (!global.localStorage) {
  global.localStorage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };
}

// Setup sessionStorage if not available
if (!global.sessionStorage) {
  global.sessionStorage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };
}

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
