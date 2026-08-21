// @vitest-environment jsdom
import { vi } from "vitest"

// IntersectionObserver mock (used by Vuetify)
globalThis.IntersectionObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
})) as unknown as typeof IntersectionObserver

// ResizeObserver mock
globalThis.ResizeObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
})) as unknown as typeof ResizeObserver

// PointerEvents check for Vuetify
globalThis.PointerEvent = class PointerEvent extends Event {
  constructor(type: string, init?: PointerEventInit) {
    super(type, init)
  }
} as unknown as typeof PointerEvent

// Match media mock
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})
