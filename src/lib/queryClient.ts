import { QueryClient } from '@tanstack/react-query';
import axios from 'axios';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: (count, error) => {
        if (axios.isCancel(error) || !axios.isAxiosError(error)) return false;
        const status = error.response?.status;
        return count < 1 && (status === undefined || status >= 500);
      },
    },
    // Không tự gửi lại thao tác ghi khi chưa biết kết quả phía server.
    mutations: { retry: false },
  },
});
