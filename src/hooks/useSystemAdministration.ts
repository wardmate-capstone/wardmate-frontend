import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';

export function useSystemAdministration<T>(kind: string, filters: unknown, loader: (signal: AbortSignal) => Promise<T>, enabled = true) {
  const user = useAuthStore(state => state.user);
  return useQuery({
    queryKey: ['system-administration', user?.id, kind, filters],
    queryFn: ({ signal }) => loader(signal), enabled: enabled && !!user?.roles.includes('IT_ADMIN'),
    retry: false, staleTime: 0,
  });
}
