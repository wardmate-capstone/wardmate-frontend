import { useAuthStore } from '@/stores/authStore';

export function useAuthState(): { isAuthenticated: boolean } {
  const isAuthenticated = useAuthStore(state => state.status === 'authenticated');
  return { isAuthenticated };
}
