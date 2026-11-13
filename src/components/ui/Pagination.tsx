import type { ReactNode } from 'react';
import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

export type PaginationProps = {
  page: number;
  /** Tổng số bản ghi; bỏ trống khi máy chủ không trả tổng (chỉ hiện "Trang N") */
  total?: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  /** Chỉ biết số trang, không biết số bản ghi: hiện "Trang 2/5" và bỏ phần "· N mục" */
  totalPages?: number;
  /** Đơn vị hiển thị sau tổng số, ví dụ "hồ sơ", "biểu mẫu" */
  unit?: string;
  /** Ghi đè việc còn trang sau hay không (khi không có tổng, hoặc máy chủ giới hạn số trang) */
  hasNext?: boolean;
  /** Khóa nút khi đang tải trang mới */
  disabled?: boolean;
  /** Tên vùng phân trang cho trình đọc màn hình */
  label?: string;
  /** Phần bổ sung đặt trước nút chuyển trang, ví dụ ô chọn số dòng mỗi trang */
  extra?: ReactNode;
  className?: string;
};

const navButton =
  'inline-flex h-11 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-800 disabled:cursor-not-allowed disabled:opacity-50';

/** Thanh phân trang dùng chung: "Trang 2/5 · 87 hồ sơ" bên trái, nút Trang trước/Trang sau bên phải */
export function Pagination({ page, total, pageSize, onPageChange, totalPages: pagesOverride, unit = 'mục', hasNext, disabled = false, label = 'Phân trang', extra, className }: PaginationProps) {
  const totalPages = pagesOverride ?? (total === undefined ? undefined : Math.max(1, Math.ceil(total / pageSize)));
  const canNext = hasNext ?? (totalPages !== undefined && page < totalPages);
  return (
    <nav aria-label={label} className={cn('flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600', className)}>
      <p>
        Trang <strong className="text-slate-900">{page}</strong>
        {totalPages !== undefined && <>/{totalPages}</>}
        {total !== undefined && <> · <strong className="text-slate-900">{total.toLocaleString('vi-VN')}</strong> {unit}</>}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {extra}
        <button type="button" className={navButton} disabled={disabled || page <= 1} onClick={() => onPageChange(page - 1)}>
          <CaretLeft size={14} weight="bold" aria-hidden="true" />
          Trang trước
        </button>
        <button type="button" className={navButton} disabled={disabled || !canNext} onClick={() => onPageChange(page + 1)}>
          Trang sau
          <CaretRight size={14} weight="bold" aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}
