import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { analyticsApi, type AnalyticsQuery } from '@/lib/api/analytics';

export function useAnalytics<T>(kind: string, loader: (filters: AnalyticsQuery, signal?: AbortSignal) => Promise<T>, filters: AnalyticsQuery, enabled = true) {
  const user = useAuthStore(state => state.user);
  return useQuery({
    queryKey: ['analytics', user?.id, kind, filters],
    queryFn: ({ signal }) => loader(filters, signal),
    enabled: enabled && !!user?.roles.includes('MANAGER'),
  });
}
export function useCitizenFeedback(id?: string) {
  const user = useAuthStore(state => state.user);
  return useQuery({ queryKey: ['citizen-feedback', user?.id, id], queryFn: ({ signal }) => analyticsApi.getFeedback(id!, signal), enabled: !!id && !!user?.roles.includes('REGISTERED_CITIZEN'), retry: false, staleTime: 0 });
}
