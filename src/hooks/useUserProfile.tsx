import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { getMyProfile, restoreSession, type UserProfileDto } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

export function getInitials(name?: string | null): string {
  if (!name || !name.trim()) return 'CD';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  const first = parts[0][0];
  const last = parts[parts.length - 1][0];
  return (first + last).toUpperCase();
}

interface UserProfileContextValue {
  profile: UserProfileDto | null;
  loading: boolean;
  restoring: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  initials: string;
}

const UserProfileContext = createContext<UserProfileContextValue | undefined>(undefined);

export const UserProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, status } = useAuthStore();
  const profile = user?.profile ?? null;
  const restoring = status === 'restoring';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    const owner = useAuthStore.getState().user;
    if (!owner) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getMyProfile();
      if (useAuthStore.getState().user === owner) useAuthStore.setState({ user: { ...owner, profile: data } });
    } catch (err) {
      // 404 là tài khoản mới chưa cập nhật profile, không phải crash
      if (useAuthStore.getState().user === owner) setError(err instanceof Error ? err.message : 'Không thể tải hồ sơ');
    } finally {
      setLoading(false);
    }
  }, []);

  // Khi người dùng F5 / reload trang, khôi phục Access Token từ HttpOnly refresh cookie
  useEffect(() => {
    void restoreSession();
  }, []);

  const initials = useMemo(() => getInitials(profile?.fullName), [profile?.fullName]);

  const value = useMemo(
    () => ({
      profile,
      loading,
      restoring,
      error,
      refetch: fetchProfile,
      initials,
    }),
    [profile, loading, restoring, error, fetchProfile, initials]
  );

  return (
    <UserProfileContext.Provider value={value}>
      {children}
    </UserProfileContext.Provider>
  );
};

export function useUserProfile(): UserProfileContextValue {
  const context = useContext(UserProfileContext);
  if (!context) {
    throw new Error('useUserProfile must be used within a UserProfileProvider');
  }
  return context;
}
