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
