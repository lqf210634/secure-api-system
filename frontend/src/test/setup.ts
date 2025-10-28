import '@testing-library/jest-dom'
import { beforeAll, afterEach, afterAll } from 'vitest'
import { cleanup } from '@testing-library/react'
import { server } from './mocks/server'

// 启动mock服务器
beforeAll(() => server.listen())

// 每个测试后清理
afterEach(() => {
  cleanup()
  server.resetHandlers()
})

// 测试完成后关闭mock服务器
afterAll(() => server.close())

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
global.localStorage = localStorageMock

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
global.sessionStorage = sessionStorageMock

// Mock crypto
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: vi.fn().mockReturnValue(new Uint32Array(10)),
    subtle: {
      digest: vi.fn(),
      encrypt: vi.fn(),
      decrypt: vi.fn(),
    },
  },
})

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn()
global.URL.revokeObjectURL = vi.fn()

// Mock fetch if not available
if (!global.fetch) {
  global.fetch = vi.fn()
}