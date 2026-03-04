// @vitest-environment jsdom
import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useDebugPanel } from '../hooks/useDebugPanel';

// ─── Mocks (hoisted so vi.mock factory can reference them) ────────────────────

const { mockRemove, mockAddListener, mockIsDebugEnabled } = vi.hoisted(() => {
  const mockRemove = vi.fn();
  const mockAddListener = vi.fn().mockResolvedValue({ remove: mockRemove });
  const mockIsDebugEnabled = vi.fn();
  return { mockRemove, mockAddListener, mockIsDebugEnabled };
});

vi.mock('../plugins/DebugPlugin', () => ({
  Debug: {
    isDebugEnabled: mockIsDebugEnabled,
    addListener: mockAddListener,
  },
}));

vi.mock('../lib/networkLogger', () => ({
  initNetworkLogger: vi.fn(),
}));

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useDebugPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with isOpen=false and isEnabled=false', async () => {
    mockIsDebugEnabled.mockResolvedValue({ enabled: false });

    const { result } = renderHook(() => useDebugPanel());

    expect(result.current.isOpen).toBe(false);
    expect(result.current.isEnabled).toBe(false);
  });

  it('sets isEnabled=true when plugin returns enabled', async () => {
    mockIsDebugEnabled.mockResolvedValue({ enabled: true });

    const { result } = renderHook(() => useDebugPanel());

    await waitFor(() => {
      expect(result.current.isEnabled).toBe(true);
    });
  });

  it('leaves isEnabled=false when debug is disabled', async () => {
    mockIsDebugEnabled.mockResolvedValue({ enabled: false });

    const { result } = renderHook(() => useDebugPanel());

    await waitFor(() => {
      expect(result.current.isEnabled).toBe(false);
    });
    expect(result.current.isOpen).toBe(false);
  });

  it('handles plugin unavailable gracefully', async () => {
    mockIsDebugEnabled.mockRejectedValue(new Error('Plugin not available'));

    const { result } = renderHook(() => useDebugPanel());

    // Should not throw; should remain disabled
    await waitFor(() => {
      expect(result.current.isEnabled).toBe(false);
    });
  });

  it('registers a shake listener on mount', async () => {
    mockIsDebugEnabled.mockResolvedValue({ enabled: true });

    renderHook(() => useDebugPanel());

    await waitFor(() => {
      expect(mockAddListener).toHaveBeenCalledWith('shake', expect.any(Function));
    });
  });

  it('opens the panel when setIsOpen(true) is called', async () => {
    mockIsDebugEnabled.mockResolvedValue({ enabled: true });

    const { result } = renderHook(() => useDebugPanel());

    act(() => {
      result.current.setIsOpen(true);
    });

    expect(result.current.isOpen).toBe(true);
  });

  it('removes shake listener on unmount', async () => {
    mockIsDebugEnabled.mockResolvedValue({ enabled: true });

    const { unmount } = renderHook(() => useDebugPanel());

    await waitFor(() => {
      expect(mockAddListener).toHaveBeenCalled();
    });

    unmount();

    await waitFor(() => {
      expect(mockRemove).toHaveBeenCalled();
    });
  });
});
