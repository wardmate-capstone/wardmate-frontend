import { useEffect, type PropsWithChildren } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { useAuthStore } from '@/stores/authStore';

export function QueryProvider({ children }: PropsWithChildren) {
  useEffect(() => useAuthStore.subscribe((state, previous) => {
    // Cache chỉ ở RAM; xóa ngay khi đăng xuất, hết phiên hoặc đổi tài khoản.
    if (state.user?.id !== previous.user?.id) queryClient.clear();
  }), []);
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
