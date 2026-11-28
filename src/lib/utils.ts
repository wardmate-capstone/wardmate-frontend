import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {
    return 'Chào buổi sáng';
  }
  if (hour >= 12 && hour < 18) {
    return 'Chào buổi chiều';
  }
  return 'Chào buổi tối';
}

/** Bỏ dấu tiếng Việt (kể cả đ/Đ), viết thường: "Khai tử" → "khai tu". Dùng cho ô tìm kiếm phía FE. */
export function foldText(text: string | null | undefined): string {
  return (text ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().trim();
}

/** true khi từ khóa (không phân biệt dấu, hoa thường) nằm trong một trong các trường; từ khóa rỗng luôn khớp. */
export function matchesSearch(query: string, ...fields: (string | null | undefined)[]): boolean {
  const q = foldText(query);
  return !q || fields.some((field) => foldText(field).includes(q));
}

/** L-19: kích thước tệp dễ đọc; dưới 1 MB hiện KB (16 KB thay vì "0.00 MB"). */
export function formatFileSize(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined || !Number.isFinite(bytes) || bytes < 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(bytes < 10 * 1024 * 1024 ? 1 : 0).replace('.', ',')} MB`;
}
