import type { z } from 'zod';
import type { submissionMethodSchema } from '@/lib/api/procedures';

// Hiển thị dữ liệu thủ tục theo mô hình linh hoạt BE-H: luôn ưu tiên văn bản nguyên văn (dự phòng)
// rồi mới tới dữ liệu có cấu trúc, cuối cùng là trường cũ — để thủ tục nhập kiểu nào cũng hiện đúng.
type Method = z.infer<typeof submissionMethodSchema>;

const COPY_LABELS: Record<string, string> = {
  ORIGINAL: 'bản chính',
  CERTIFIED_COPY: 'bản sao chứng thực',
  REGULAR_COPY: 'bản sao',
  OTHER: 'bản (loại khác)',
};
const TIME_UNITS: Record<string, string> = { WORKING_DAY: 'ngày làm việc', DAY: 'ngày', HOUR: 'giờ', MINUTE: 'phút' };
export const PROCESSING_TIME_UNIT_LABELS = TIME_UNITS;

export const copyTypeLabel = (type?: string | null) => (type ? COPY_LABELS[type] ?? type : 'bản');

const money = (amount: number, unit?: string | null) => {
  if (amount === 0) return 'Miễn phí';
  const u = unit?.trim() || 'VND';
  return `${amount.toLocaleString('vi-VN')} ${/^(VND|VNĐ|Đ)$/i.test(u) ? 'đồng' : u}`;
};

/** Số lượng giấy tờ: quantityText → copyRequirements (nhiều loại bản) → quantity + loại bản. */
type QuantitySource = { quantity?: number | null; documentCopyType?: string | null; copyRequirements?: { documentCopyType: string; quantity: number }[] | null; quantityText?: string | null };
export function checklistQuantityLabel(item: QuantitySource) {
  if (item.quantityText?.trim()) return item.quantityText.trim();
  if (item.copyRequirements?.length) return item.copyRequirements.map(c => `${c.quantity} ${copyTypeLabel(c.documentCopyType)}`).join(' và ');
  return `${item.quantity ?? 1} ${copyTypeLabel(item.documentCopyType)}`;
}

/** Phí của một cách nộp: feeText → danh sách fees → feeAmount; null khi không có thông tin. */
export function methodFeeLabel(method: Method): string | null {
  if (method.feeText?.trim()) return method.feeText.trim();
  if (method.fees?.length) {
    return method.fees.map(fee => {
      const value = fee.amount != null ? money(fee.amount, fee.unit) : fee.percent != null ? `${fee.percent.toLocaleString('vi-VN')}%` : '';
      return [fee.description?.trim(), value].filter(Boolean).join(': ');
    }).filter(Boolean).join('; ') || null;
  }
  return method.feeAmount != null ? money(method.feeAmount, method.feeUnit) : null;
}

/** Thời hạn của một cách nộp: processingTime.text → value + đơn vị → estimatedDays; null khi không quy định. */
export function methodTimeLabel(method: Method): string | null {
  const time = method.processingTime;
  if (time?.text?.trim()) return time.text.trim();
  if (time?.value != null) return `${time.value.toLocaleString('vi-VN')} ${TIME_UNITS[time.unit ?? ''] ?? 'ngày'}`;
  if (method.estimatedDays != null) return method.estimatedDays > 0 ? `${method.estimatedDays.toLocaleString('vi-VN')} ngày làm việc` : 'Trong ngày';
  return null;
}
