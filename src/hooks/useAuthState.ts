import { useSyncExternalStore } from 'react';
import { authClient } from '@/lib/api';

function subscribe(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('wardmate-auth-state', callback);
  return () => {
    window.removeEventListener('wardmate-auth-state', callback);
  };
}

function getSnapshot(): boolean {
  return authClient.hasAccessToken();
}

function getServerSnapshot(): boolean {
  return false;
}

export function useAuthState(): { isAuthenticated: boolean } {
  const isAuthenticated = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return { isAuthenticated };
}
