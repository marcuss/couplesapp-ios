import { useEffect, useState } from 'react';
import { Debug } from '../plugins/DebugPlugin';
import { initNetworkLogger } from '../lib/networkLogger';

export function useDebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    let cancelled = false;

    Debug.isDebugEnabled()
      .then(({ enabled }) => {
        if (cancelled) return;
        setIsEnabled(enabled);
        if (enabled) {
          // Start intercepting fetch calls only when debug is active
          initNetworkLogger();
        }
      })
      .catch(() => {
        // Plugin unavailable (e.g. web) — leave disabled
      });

    // Listen for native shake event
    const listenerPromise = Debug.addListener('shake', () => {
      setIsOpen(true);
    }).catch(() => null);

    return () => {
      cancelled = true;
      listenerPromise.then((handle) => handle?.remove());
    };
  }, []);

  return { isOpen, setIsOpen, isEnabled };
}
