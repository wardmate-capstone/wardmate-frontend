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
