import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authErrorMessage, logout } from '@/lib/api';
import { toast } from '@/components/ui/Toast';

export function useLogout(redirectTo: string = '/') {
  const navigate = useNavigate();
  const pending = useRef(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    if (pending.current) return false;
    pending.current = true;
    setIsLoggingOut(true);
    try {
      await logout();
      toast.success('Đã đăng xuất.', { id: 'auth-logout' });
      navigate(redirectTo, { replace: true });
      return true;
    } catch (error) {
      toast.error('Đã đăng xuất trên máy này, nhưng hệ thống chưa xác nhận. ' + authErrorMessage(error), { id: 'auth-logout' });
      return false;
    } finally {
      pending.current = false;
      setIsLoggingOut(false);
    }
  }

  return { handleLogout, isLoggingOut };
}
