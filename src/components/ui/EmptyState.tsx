import type { ReactNode } from 'react';
import { Tray, type Icon } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

export type EmptyStateProps = {
  title: string;
  description?: ReactNode;
  /** Icon minh họa (mặc định khay rỗng) */
  icon?: Icon;
  /** Nút gợi ý bước tiếp theo, ví dụ "Xóa bộ lọc" hoặc "+ Thêm …" */
  action?: ReactNode;
  className?: string;
};

/** Khung "chưa có dữ liệu" dùng chung: icon tròn, tiêu đề, gợi ý ngắn, căn giữa */
export function EmptyState({ title, description, icon: IconComponent = Tray, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-2 px-4 py-10 text-center', className)}>
      <span className="mb-1 grid size-12 place-items-center rounded-full bg-slate-100 text-slate-400">
        <IconComponent size={24} aria-hidden="true" />
      </span>
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      {description && <p className="max-w-md text-xs leading-5 text-slate-500">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
