import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Run cleanup after each test case
afterEach(() => {
  cleanup();
});

// Make sure global is defined for JSdom
if (globalThis.window) {
  globalThis.global = globalThis;
}

// Stub browser APIs missing from jsdom that Radix UI relies on
window.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
window.HTMLElement.prototype.scrollIntoView = vi.fn();
window.HTMLElement.prototype.hasPointerCapture = vi.fn(
  () => false,
) as typeof HTMLElement.prototype.hasPointerCapture;
window.HTMLElement.prototype.setPointerCapture = vi.fn();
window.HTMLElement.prototype.releasePointerCapture = vi.fn();
