/**
 * Formats a date string into friendly Vietnamese relative or standard time
 */
export function formatNotificationTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return dateStr;
    }

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) {
      return 'Vừa xong';
    }
    if (diffMin < 60) {
      return `${diffMin} phút trước`;
    }
    if (diffHour < 24) {
      return `${diffHour} giờ trước`;
    }
    if (diffDay === 1) {
      return 'Hôm qua';
    }
    if (diffDay < 7) {
      return `${diffDay} ngày trước`;
    }

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${hours}:${minutes}, ${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
}
