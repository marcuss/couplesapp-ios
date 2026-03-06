// @vitest-environment jsdom

// Polyfill scrollIntoView for jsdom
Element.prototype.scrollIntoView = () => {};

import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DebugPanel } from '../components/debug/DebugPanel';
import { DebugLogger } from '../lib/networkLogger';

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('../plugins/DebugPlugin', () => ({
  Debug: {
    getLogs: vi.fn().mockResolvedValue({
      logs: [
        {
          id: 'log-1',
          timestamp: new Date().toISOString(),
          level: 'info',
          message: 'App initialized',
        },
        {
          id: 'log-2',
          timestamp: new Date().toISOString(),
          level: 'warn',
          message: 'Token refresh needed',
        },
        {
          id: 'log-3',
          timestamp: new Date().toISOString(),
          level: 'error',
          message: 'Failed to load events',
        },
      ],
    }),
    getDeviceInfo: vi.fn().mockResolvedValue({
      model: 'iPhone 16 Pro',
      systemVersion: '18.0',
      appVersion: '1.0.0',
      buildNumber: '42',
      environment: 'TestFlight',
      bundleId: 'com.nextasy.couplesapp',
    }),
    clearLogs: vi.fn().mockResolvedValue(undefined),
    isDebugEnabled: vi.fn().mockResolvedValue({ enabled: true }),
    addListener: vi.fn().mockResolvedValue({ remove: vi.fn() }),
  },
}));

vi.mock('../infrastructure/repositories/supabaseClient', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'user-test-123' } },
        error: null,
      }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
  },
}));

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('DebugPanel', () => {
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    DebugLogger.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(<DebugPanel isOpen={false} onClose={onClose} />);
    expect(container.firstChild).toBeNull();
  });

  it('shows the panel header when open', () => {
    render(<DebugPanel isOpen={true} onClose={onClose} />);
    expect(screen.queryByText('🐛 Debug Panel')).not.toBeNull();
  });

  it('renders the four tab buttons', () => {
    render(<DebugPanel isOpen={true} onClose={onClose} />);
    expect(screen.queryByText('Logs')).not.toBeNull();
    expect(screen.queryByText('Network')).not.toBeNull();
    expect(screen.queryByText('Device')).not.toBeNull();
    expect(screen.queryByText('Actions')).not.toBeNull();
  });

  it('displays log entries in Logs tab', async () => {
    render(<DebugPanel isOpen={true} onClose={onClose} />);
    await waitFor(() => {
      expect(screen.queryByText('App initialized')).not.toBeNull();
      expect(screen.queryByText('Token refresh needed')).not.toBeNull();
      expect(screen.queryByText('Failed to load events')).not.toBeNull();
    });
  });

  it('calls clearLogs on clear button click', async () => {
    const { Debug } = await import('../plugins/DebugPlugin');
    render(<DebugPanel isOpen={true} onClose={onClose} />);
    await waitFor(() => expect(screen.queryByText('🗑 Limpiar logs')).not.toBeNull());

    fireEvent.click(screen.getByText('🗑 Limpiar logs'));
    expect(Debug.clearLogs).toHaveBeenCalled();
  });

  it('calls onClose when ✕ is clicked', () => {
    render(<DebugPanel isOpen={true} onClose={onClose} />);
    const closeBtn = screen.getByLabelText('Close debug panel');
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('switches to Device tab and shows device info', async () => {
    render(<DebugPanel isOpen={true} onClose={onClose} />);
    fireEvent.click(screen.getByText('Device'));

    await waitFor(() => {
      expect(screen.queryByText('iPhone 16 Pro')).not.toBeNull();
      expect(screen.queryByText('TestFlight')).not.toBeNull();
    });
  });

  it('switches to Actions tab and shows action buttons', () => {
    render(<DebugPanel isOpen={true} onClose={onClose} />);
    fireEvent.click(screen.getByText('Actions'));

    expect(screen.queryByText(/Limpiar caché de Supabase/)).not.toBeNull();
    expect(screen.queryByText(/Ir a Login/)).not.toBeNull();
    expect(screen.queryByText(/Resetear onboarding/)).not.toBeNull();
  });

  it('filters logs by level', async () => {
    render(<DebugPanel isOpen={true} onClose={onClose} />);
    await waitFor(() => expect(screen.queryByText('App initialized')).not.toBeNull());

    // Filter to only errors
    fireEvent.click(screen.getByText('error'));

    await waitFor(() => {
      expect(screen.queryByText('App initialized')).toBeNull();
      expect(screen.queryByText('Token refresh needed')).toBeNull();
      expect(screen.queryByText('Failed to load events')).not.toBeNull();
    });
  });
});
