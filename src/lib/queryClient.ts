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
      // Thử lại 1 lần với lỗi mạng/5xx (kể cả 503 khi dịch vụ Azure đang khởi động). Hết lượt thì
      // màn hình hiện lỗi + nút Thử lại (FE-02) để người dùng chủ động gọi lại.
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
