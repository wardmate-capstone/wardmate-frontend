import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authErrorMessage, logout } from '@/lib/api';
import { toast } from '@/components/ui/Toast';

export function useLogout() {
  const navigate = useNavigate();
  const pending = useRef(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  async function handleLogout() {
    if (pending.current) return false;
    pending.current = true;
    setIsLoggingOut(true);
    try {
      await logout();
      toast.success('Đã đăng xuất thành công.');
      navigate('/dang-nhap', { replace: true });
      return true;
    } catch (error) {
      toast.error('Chưa xác nhận được việc thu hồi phiên trên máy chủ. ' + authErrorMessage(error));
      return false;
    } finally {
      pending.current = false;
      setIsLoggingOut(false);
    }
  }
  return { handleLogout, isLoggingOut };
}
