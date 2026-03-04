import { registerPlugin } from '@capacitor/core';

// ─── Data types ──────────────────────────────────────────────────────────────

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'network';
  message: string;
  metadata?: Record<string, string>;
}

export interface DeviceDebugInfo {
  model: string;
  systemVersion: string;
  appVersion: string;
  buildNumber: string;
  environment: 'Debug' | 'TestFlight' | 'Production';
  bundleId: string;
}

// ─── Plugin interface ─────────────────────────────────────────────────────────

export interface DebugPluginInterface {
  isDebugEnabled(): Promise<{ enabled: boolean }>;
  getLogs(): Promise<{ logs: LogEntry[] }>;
  getDeviceInfo(): Promise<DeviceDebugInfo>;
  clearLogs(): Promise<void>;
  addListener(event: 'shake', handler: () => void): Promise<{ remove: () => void }>;
}

// ─── Registration ─────────────────────────────────────────────────────────────

export const Debug = registerPlugin<DebugPluginInterface>('Debug', {
  // Web fallback — always returns disabled so the panel never shows in browser.
  web: () =>
    import('./DebugPluginWeb').then((m) => new m.DebugPluginWeb()),
});
