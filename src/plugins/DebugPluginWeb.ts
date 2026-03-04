import { WebPlugin } from '@capacitor/core';
import type { DebugPluginInterface, DeviceDebugInfo, LogEntry } from './DebugPlugin';

/**
 * Web fallback — used in browser/Playwright tests.
 * Always reports debug as disabled so the panel is never visible outside native.
 */
export class DebugPluginWeb extends WebPlugin implements DebugPluginInterface {
  async isDebugEnabled(): Promise<{ enabled: boolean }> {
    return { enabled: false };
  }

  async getLogs(): Promise<{ logs: LogEntry[] }> {
    return { logs: [] };
  }

  async getDeviceInfo(): Promise<DeviceDebugInfo> {
    return {
      model: 'Browser',
      systemVersion: navigator.userAgent,
      appVersion: '0.0.0',
      buildNumber: '0',
      environment: 'Production',
      bundleId: 'com.nextasy.couplesapp',
    };
  }

  async clearLogs(): Promise<void> {
    // no-op in web
  }
}
