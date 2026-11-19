import { useQuery } from '@tanstack/react-query';
import { getPublicWards } from '@/lib/api';

/**
 * Tra tên phường/xã từ danh mục phường công khai (GET /api/v1/wards, cache 1 giờ).
 * Không hiện mã nội bộ (vd. TEST_A) cho người dùng: chưa tra được thì trả "—".
 */
export function useWardName() {
  const wards = useQuery({ queryKey: ['public-wards'], queryFn: getPublicWards, staleTime: 3_600_000, retry: false });
  return (code: string | null | undefined, fallbackName?: string | null): string => {
    if (fallbackName?.trim()) return fallbackName.trim();
    if (!code) return '—';
    const key = code.toLowerCase();
    return wards.data?.find((ward) => ward.code.toLowerCase() === key)?.name ?? '—';
  };
}
