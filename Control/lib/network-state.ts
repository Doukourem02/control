import { useEffect, useState } from 'react';

let offline = false;
const listeners = new Set<(isOffline: boolean) => void>();

export function notifyNetworkOffline() {
  if (!offline) {
    offline = true;
    listeners.forEach((l) => l(true));
  }
}

export function notifyNetworkOnline() {
  if (offline) {
    offline = false;
    listeners.forEach((l) => l(false));
  }
}

export function getIsOffline(): boolean {
  return offline;
}

export function useNetworkStatus(): boolean {
  const [isOffline, setIsOffline] = useState(offline);
  useEffect(() => {
    const handler = (v: boolean) => setIsOffline(v);
    listeners.add(handler);
    setIsOffline(offline);
    return () => {
      listeners.delete(handler);
    };
  }, []);
  return isOffline;
}
