/**
 * networkLogger.ts
 *
 * Monkey-patches window.fetch to capture all HTTP traffic into the in-memory
 * debug log. Only active when `initNetworkLogger()` is called and debug is enabled.
 * Safe to call multiple times — idempotent.
 */

// ─── In-browser log store (mirrors the native LogInterceptor) ────────────────

export interface NetworkLogEntry {
  id: string;
  timestamp: string;
  type: 'request' | 'response' | 'error';
  url: string;
  method?: string;
  status?: number;
  duration?: number;
  body?: string;
  error?: string;
}

const MAX_ENTRIES = 500;
let _entries: NetworkLogEntry[] = [];
let _patched = false;

const listeners: Array<(entries: NetworkLogEntry[]) => void> = [];

function notify() {
  const snapshot = [..._entries];
  listeners.forEach((l) => l(snapshot));
}

export const DebugLogger = {
  logNetwork(entry: Omit<NetworkLogEntry, 'id' | 'timestamp'>) {
    const full: NetworkLogEntry = {
      id: Math.random().toString(36).slice(2),
      timestamp: new Date().toISOString(),
      ...entry,
    };
    _entries.push(full);
    if (_entries.length > MAX_ENTRIES) {
      _entries = _entries.slice(_entries.length - MAX_ENTRIES);
    }
    notify();
  },

  getEntries(): NetworkLogEntry[] {
    return [..._entries];
  },

  clear() {
    _entries = [];
    notify();
  },

  subscribe(cb: (entries: NetworkLogEntry[]) => void) {
    listeners.push(cb);
    return () => {
      const i = listeners.indexOf(cb);
      if (i !== -1) listeners.splice(i, 1);
    };
  },
};

// ─── Fetch interceptor ───────────────────────────────────────────────────────

export function initNetworkLogger() {
  if (_patched || typeof window === 'undefined') return;
  _patched = true;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : (input as Request).url;
    const method = init?.method ?? (input instanceof Request ? input.method : 'GET');
    const startTime = Date.now();

    DebugLogger.logNetwork({
      type: 'request',
      url,
      method,
      body: typeof init?.body === 'string' ? init.body : undefined,
    });

    try {
      const response = await originalFetch(input, init);
      const duration = Date.now() - startTime;

      DebugLogger.logNetwork({
        type: 'response',
        url,
        method,
        status: response.status,
        duration,
      });

      return response;
    } catch (err) {
      DebugLogger.logNetwork({
        type: 'error',
        url,
        method,
        error: String(err),
        duration: Date.now() - startTime,
      });
      throw err;
    }
  };
}

export function resetNetworkLogger() {
  _patched = false;
}
