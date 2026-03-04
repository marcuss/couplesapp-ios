import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Debug, DeviceDebugInfo, LogEntry } from '../../plugins/DebugPlugin';
import { DebugLogger, NetworkLogEntry } from '../../lib/networkLogger';
import { supabase } from '../../infrastructure/repositories/supabaseClient';

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'logs' | 'network' | 'device' | 'actions';
type LogLevel = 'all' | 'info' | 'warn' | 'error' | 'network';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const LEVEL_COLORS: Record<string, string> = {
  info: 'text-green-400',
  warn: 'text-yellow-400',
  error: 'text-red-400',
  network: 'text-blue-400',
};

const LEVEL_LABELS: Record<string, string> = {
  info:    '[INFO]',
  warn:    '[WARN]',
  error:   '[ERR ]',
  network: '[NET ]',
};

function fmtTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString('en-US', { hour12: false });
  } catch {
    return iso;
  }
}

function copyToClipboard(text: string) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).catch(() => {});
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const LogRow: React.FC<{ entry: LogEntry }> = ({ entry }) => (
  <div className="flex gap-2 py-0.5 font-mono text-xs border-b border-zinc-800">
    <span className={`shrink-0 ${LEVEL_COLORS[entry.level] ?? 'text-zinc-400'}`}>
      {LEVEL_LABELS[entry.level] ?? entry.level.toUpperCase()}
    </span>
    <span className="shrink-0 text-zinc-500">{fmtTime(entry.timestamp)}</span>
    <span className="text-zinc-200 break-all">{entry.message}</span>
  </div>
);

const NetworkRow: React.FC<{ entry: NetworkLogEntry }> = ({ entry }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="py-0.5 font-mono text-xs border-b border-zinc-800 cursor-pointer select-none"
      onClick={() => setExpanded((v) => !v)}
    >
      <div className="flex gap-2">
        <span
          className={`shrink-0 ${
            entry.type === 'error'
              ? 'text-red-400'
              : entry.type === 'request'
              ? 'text-blue-400'
              : entry.status && entry.status >= 400
              ? 'text-red-400'
              : 'text-green-400'
          }`}
        >
          {entry.type === 'request' ? '↑' : entry.type === 'error' ? '✕' : '↓'}
          {entry.method ? ` ${entry.method}` : ''}
        </span>
        <span className="shrink-0 text-zinc-500">{fmtTime(entry.timestamp)}</span>
        {entry.status && (
          <span
            className={`shrink-0 ${entry.status >= 400 ? 'text-red-400' : 'text-green-400'}`}
          >
            {entry.status}
          </span>
        )}
        {entry.duration !== undefined && (
          <span className="shrink-0 text-zinc-500">{entry.duration}ms</span>
        )}
        <span className="text-zinc-200 truncate">{entry.url}</span>
      </div>
      {expanded && (entry.body || entry.error) && (
        <div className="mt-1 ml-4 text-zinc-400 break-all whitespace-pre-wrap">
          {entry.error ?? entry.body}
        </div>
      )}
    </div>
  );
};

// ─── Main panel ───────────────────────────────────────────────────────────────

export const DebugPanel: React.FC<Props> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<Tab>('logs');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [netLogs, setNetLogs] = useState<NetworkLogEntry[]>([]);
  const [deviceInfo, setDeviceInfo] = useState<DeviceDebugInfo | null>(null);
  const [logFilter, setLogFilter] = useState<LogLevel>('all');
  const [userId, setUserId] = useState<string | null>(null);
  const [actionStatus, setActionStatus] = useState<string>('');
  const logsEndRef = useRef<HTMLDivElement>(null);

  // ── Fetch data on open ──────────────────────────────────────────────────────

  const refreshLogs = useCallback(() => {
    Debug.getLogs()
      .then(({ logs }) => setLogs(logs))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    refreshLogs();
    setNetLogs(DebugLogger.getEntries());
    Debug.getDeviceInfo().then(setDeviceInfo).catch(() => {});
    supabase.auth.getUser().then(({ data }) => setUserId(data?.user?.id ?? null));

    // Subscribe to live network events
    const unsub = DebugLogger.subscribe(setNetLogs);
    return unsub;
  }, [isOpen, refreshLogs]);

  // ── Auto-scroll logs ────────────────────────────────────────────────────────

  useEffect(() => {
    if (activeTab === 'logs') {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, activeTab]);

  // ── Actions ─────────────────────────────────────────────────────────────────

  const flashStatus = (msg: string) => {
    setActionStatus(msg);
    setTimeout(() => setActionStatus(''), 3000);
  };

  const handleClearLogs = () => {
    Debug.clearLogs().catch(() => {});
    DebugLogger.clear();
    setLogs([]);
    flashStatus('Logs cleared');
  };

  const handleCopyLogs = () => {
    const text = logs
      .map((l) => `${fmtTime(l.timestamp)} ${l.level.toUpperCase()} ${l.message}`)
      .join('\n');
    copyToClipboard(text);
    flashStatus('Logs copied to clipboard');
  };

  const handleClearSupabaseCache = async () => {
    await supabase.auth.signOut();
    flashStatus('Supabase session cleared — please reload');
  };

  const handleGoToLogin = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const handleResetOnboarding = () => {
    localStorage.removeItem('onboarding_completed');
    flashStatus('Onboarding reset — restart app to see it again');
  };

  const handleCopyUserId = () => {
    if (userId) {
      copyToClipboard(userId);
      flashStatus('User ID copied');
    } else {
      flashStatus('No user logged in');
    }
  };

  const handleCopySupabaseUrl = () => {
    const url = import.meta.env.VITE_SUPABASE_URL ?? '';
    copyToClipboard(url);
    flashStatus('Supabase URL copied');
  };

  // ── Filter logs ─────────────────────────────────────────────────────────────

  const filteredLogs =
    logFilter === 'all' ? logs : logs.filter((l) => l.level === logFilter);

  if (!isOpen) return null;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-zinc-950 text-zinc-100">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900">
        <div>
          <span className="font-bold text-base">🐛 Debug Panel</span>
          {deviceInfo && (
            <span className="ml-2 text-xs text-zinc-400">
              {deviceInfo.environment} v{deviceInfo.appVersion} ({deviceInfo.buildNumber}) · {deviceInfo.model}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-zinc-400 hover:text-white text-lg px-2"
          aria-label="Close debug panel"
        >
          ✕
        </button>
      </div>

      {/* Tabs */}
      <div className="shrink-0 flex border-b border-zinc-800 bg-zinc-900">
        {(['logs', 'network', 'device', 'actions'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-sm font-medium capitalize transition-colors ${
              activeTab === tab
                ? 'text-white border-b-2 border-blue-500'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {tab === 'logs' ? 'Logs' : tab === 'network' ? 'Network' : tab === 'device' ? 'Device' : 'Actions'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-2 py-1">

        {/* ── LOGS TAB ── */}
        {activeTab === 'logs' && (
          <>
            {/* Level filter */}
            <div className="flex gap-1 py-1 mb-1">
              {(['all', 'info', 'warn', 'error', 'network'] as LogLevel[]).map((l) => (
                <button
                  key={l}
                  onClick={() => setLogFilter(l)}
                  className={`px-2 py-0.5 rounded text-xs font-mono transition-colors ${
                    logFilter === l
                      ? 'bg-blue-600 text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>

            {filteredLogs.length === 0 ? (
              <p className="text-zinc-600 text-xs font-mono mt-4 text-center">No logs yet</p>
            ) : (
              filteredLogs.map((entry) => <LogRow key={entry.id} entry={entry} />)
            )}
            <div ref={logsEndRef} />
          </>
        )}

        {/* ── NETWORK TAB ── */}
        {activeTab === 'network' && (
          <>
            {netLogs.length === 0 ? (
              <p className="text-zinc-600 text-xs font-mono mt-4 text-center">No network activity yet</p>
            ) : (
              netLogs.map((entry) => <NetworkRow key={entry.id} entry={entry} />)
            )}
          </>
        )}

        {/* ── DEVICE TAB ── */}
        {activeTab === 'device' && (
          <div className="font-mono text-xs space-y-1 mt-2">
            {deviceInfo ? (
              <>
                <InfoRow label="Model" value={deviceInfo.model} />
                <InfoRow label="iOS" value={deviceInfo.systemVersion} />
                <InfoRow label="App Version" value={deviceInfo.appVersion} />
                <InfoRow label="Build" value={deviceInfo.buildNumber} />
                <InfoRow label="Environment" value={deviceInfo.environment} />
                <InfoRow label="Bundle ID" value={deviceInfo.bundleId} />
              </>
            ) : (
              <p className="text-zinc-600">Loading device info…</p>
            )}
            <div className="border-t border-zinc-800 pt-2 mt-2">
              <InfoRow label="Supabase URL" value={import.meta.env.VITE_SUPABASE_URL ?? '(not set)'} />
              <InfoRow label="User ID" value={userId ?? '(not logged in)'} />
            </div>
          </div>
        )}

        {/* ── ACTIONS TAB ── */}
        {activeTab === 'actions' && (
          <div className="space-y-2 mt-2">
            {actionStatus && (
              <div className="text-center text-xs bg-zinc-800 text-green-400 py-1 rounded font-mono">
                {actionStatus}
              </div>
            )}
            <ActionButton label="🗑  Limpiar caché de Supabase" onClick={handleClearSupabaseCache} danger />
            <ActionButton label="🚪 Ir a Login (forzar logout)" onClick={handleGoToLogin} danger />
            <ActionButton label="🔄 Resetear onboarding" onClick={handleResetOnboarding} />
            <ActionButton label="📋 Copiar User ID" onClick={handleCopyUserId} />
            <ActionButton label="📋 Copiar Supabase URL" onClick={handleCopySupabaseUrl} />
          </div>
        )}
      </div>

      {/* Footer — Logs & Network tabs */}
      {(activeTab === 'logs' || activeTab === 'network') && (
        <div className="shrink-0 flex gap-2 px-4 py-2 border-t border-zinc-800 bg-zinc-900">
          <button
            onClick={handleClearLogs}
            className="flex-1 py-2 text-sm rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
          >
            🗑 Limpiar logs
          </button>
          <button
            onClick={handleCopyLogs}
            className="flex-1 py-2 text-sm rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
          >
            📋 Copiar todo
          </button>
        </div>
      )}
    </div>
  );
};

// ─── Minor helpers ────────────────────────────────────────────────────────────

const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex gap-2">
    <span className="text-zinc-500 shrink-0 w-28">{label}:</span>
    <span className="text-zinc-200 break-all">{value}</span>
  </div>
);

const ActionButton: React.FC<{ label: string; onClick: () => void; danger?: boolean }> = ({
  label,
  onClick,
  danger,
}) => (
  <button
    onClick={onClick}
    className={`w-full py-3 rounded text-sm font-medium transition-colors ${
      danger
        ? 'bg-red-900 hover:bg-red-800 text-red-200'
        : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100'
    }`}
  >
    {label}
  </button>
);
