import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { getMyProfile, restoreSession, type UserProfileDto } from '@/lib/api';
import { useAuthState } from '@/hooks/useAuthState';

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
  const { isAuthenticated } = useAuthState();
  const [profile, setProfile] = useState<UserProfileDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!isAuthenticated) {
      setProfile(null);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getMyProfile();
      setProfile(data);
    } catch (err) {
      // 404 là tài khoản mới chưa cập nhật profile, không phải crash
      setError(err instanceof Error ? err.message : 'Không thể tải hồ sơ');
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const [restoring, setRestoring] = useState(true);

  // Khi người dùng F5 / reload trang, khôi phục Access Token từ HttpOnly refresh cookie
  useEffect(() => {
    let isMounted = true;
    restoreSession().finally(() => {
      if (isMounted) setRestoring(false);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchProfile();
    } else {
      setProfile(null);
      setError(null);
    }
  }, [isAuthenticated, fetchProfile]);

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
