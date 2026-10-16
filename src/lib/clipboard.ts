import { toast } from '@/components/ui/Toast';

export async function copyToClipboard(value: string, successMessage = 'Đã sao chép.') {
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(value);
    toast.success(successMessage);
    return true;
  } catch {
    toast.error('Không thể sao chép. Vui lòng chọn văn bản và sao chép thủ công.');
    return false;
  }
}
