// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DebugLogger, initNetworkLogger, resetNetworkLogger } from '../lib/networkLogger';

describe('networkLogger', () => {
  // Save real fetch before tests
  const realFetch = global.fetch;

  beforeEach(() => {
    DebugLogger.clear();
    resetNetworkLogger();

    // Provide a minimal fetch mock so we can patch it
    global.fetch = vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => ({}),
      text: async () => '',
    } as unknown as Response);
  });

  afterEach(() => {
    global.fetch = realFetch;
    DebugLogger.clear();
    resetNetworkLogger();
  });

  it('captures a successful request + response pair', async () => {
    initNetworkLogger();

    await global.fetch('https://api.example.com/test', { method: 'POST' });

    const entries = DebugLogger.getEntries();
    expect(entries).toHaveLength(2);

    const req = entries.find((e) => e.type === 'request');
    expect(req).toBeDefined();
    expect(req?.url).toBe('https://api.example.com/test');
    expect(req?.method).toBe('POST');

    const res = entries.find((e) => e.type === 'response');
    expect(res).toBeDefined();
    expect(res?.status).toBe(200);
    expect(res?.duration).toBeGreaterThanOrEqual(0);
  });

  it('captures network errors', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('Network failure')
    );
    initNetworkLogger();

    await expect(global.fetch('https://api.example.com/fail')).rejects.toThrow();

    const entries = DebugLogger.getEntries();
    const errEntry = entries.find((e) => e.type === 'error');
    expect(errEntry).toBeDefined();
    expect(errEntry?.error).toContain('Network failure');
  });

  it('is idempotent — patching twice does not double-log', async () => {
    initNetworkLogger();
    initNetworkLogger(); // second call should be no-op

    await global.fetch('https://api.example.com/single');

    const entries = DebugLogger.getEntries();
    expect(entries.filter((e) => e.type === 'request')).toHaveLength(1);
  });

  it('clears entries', () => {
    DebugLogger.logNetwork({ type: 'request', url: '/foo', method: 'GET' });
    expect(DebugLogger.getEntries()).toHaveLength(1);
    DebugLogger.clear();
    expect(DebugLogger.getEntries()).toHaveLength(0);
  });

  it('notifies subscribers on new entries', () => {
    const cb = vi.fn();
    const unsub = DebugLogger.subscribe(cb);

    DebugLogger.logNetwork({ type: 'request', url: '/x', method: 'GET' });
    expect(cb).toHaveBeenCalledTimes(1);

    unsub();
    DebugLogger.logNetwork({ type: 'response', url: '/x', status: 200 });
    expect(cb).toHaveBeenCalledTimes(1); // no more calls after unsub
  });
});
