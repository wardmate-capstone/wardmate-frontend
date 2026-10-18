import { QueryClient } from '@tanstack/react-query';
import axios from 'axios';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Giữ dữ liệu hợp lệ trong 2 phút; không tự động gọi lại liên tục khi render
      staleTime: 2 * 60_000,
      gcTime: 10 * 60_000,
      // Tắt tự động refetch ngầm khi chuyển tab/focus cửa sổ để tránh spam API
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
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
