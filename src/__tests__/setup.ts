import '@testing-library/jest-dom';
import { server } from './mocks/server';
import { beforeAll, afterAll, afterEach } from 'vitest';

// Establish API mocking before all tests.
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));

// Reset any request handlers that we may add during the tests,
// so they don't affect other tests.
afterEach(() => server.resetHandlers());

// Clean up after the tests are finished.
afterAll(() => server.close());

// Mock window.crypto.randomUUID
Object.defineProperty(globalThis, 'crypto', {
  value: {
    randomUUID: () => 'mock-uuid-1234-5678',
    getRandomValues: (arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    },
  },
});

// Mock navigator.clipboard
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: vi.fn().mockResolvedValue(undefined),
  },
  writable: true,
});

// Silence console.error for expected errors in tests
const originalConsoleError = console.error;
console.error = (...args: unknown[]) => {
  const msg = args[0]?.toString() ?? '';
  if (
    msg.includes('Warning: ReactDOM.render') ||
    msg.includes('Warning: An update to') ||
    msg.includes('not wrapped in act')
  ) {
    return;
  }
  originalConsoleError(...args);
};
