import React from 'react';
import {
  List,
  SidebarSimple,
  Plus,
  Bell,
  MagnifyingGlass,
  Sparkle
} from '@phosphor-icons/react';
import { ProcedureNavSection } from './ProcedureManagerSidebar';

interface ProcedureManagerHeaderProps {
  currentSection: ProcedureNavSection;
  onOpenMobileSidebar: () => void;
  isCollapsedDesktop: boolean;
  onToggleCollapseDesktop: () => void;
  onAddNewProcedure: () => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}

const sectionTitles: Record<ProcedureNavSection, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Tổng quan Quản lý Thủ tục',
    subtitle: 'Theo dõi 45 thủ tục công khai, 12 biểu mẫu hiện hành và trạng thái đồng bộ tri thức AI'
  },
  procedures: {
    title: 'Danh sách Thủ tục Hành chính',
    subtitle: 'Quản lý vòng đời, xuất bản, biểu mẫu và cấu hình E-form cho từng thủ tục'
  },
  categories: {
    title: 'Danh mục Thủ tục',
    subtitle: 'Phân loại các lĩnh vực hành chính cấp xã/phường (Hộ tịch, Đất đai, Chứng thực...)'
  },
  checklists: {
    title: 'Thành phần Hồ sơ (Checklist Templates)',
    subtitle: 'Quản lý các mẫu danh mục thành phần hồ sơ giấy tờ chuẩn hóa dùng chung'
  },
  steps: {
    title: 'Quy trình Thực hiện Mẫu',
    subtitle: 'Thiết kế các bước xử lý từ nộp hồ sơ, tiền kiểm đến tiếp nhận chính thức'
  },
  forms: {
    title: 'Kho Biểu mẫu Hành chính',
    subtitle: 'Quản lý các tệp PDF trống, file Word và mẫu điền minh họa kèm theo thủ tục'
  },
  'upload-form': {
    title: 'Upload / Tạo mới Biểu mẫu Chuẩn',
    subtitle: 'Tải lên biểu mẫu Word (.doc/.docx) hoặc PDF và thiết lập thời hạn hiệu lực'
  },
  'form-versions': {
    title: 'Lịch sử Phiên bản Biểu mẫu',
    subtitle: 'Theo dõi vòng đời V1, V2, V3 và quản lý thay đổi quy chuẩn biểu mẫu'
  },
  'attach-forms': {
    title: 'Gắn Biểu mẫu vào Thủ tục Hành chính',
    subtitle: 'Thiết lập danh mục biểu mẫu bắt buộc áp dụng khi công dân nộp hồ sơ'
  },
  'legal-docs': {
    title: 'Văn bản Quy phạm Pháp luật',
    subtitle: 'Kho văn bản Luật, Nghị định, Thông tư làm cơ sở pháp lý cho các thủ tục'
  },
  'procedure-legal-links': {
    title: 'Liên kết Thủ tục - Căn cứ Pháp lý',
    subtitle: 'Rà soát và thiết lập mối quan hệ điều chỉnh giữa văn bản pháp lý và thủ tục'
  },
  'ai-knowledge': {
    title: 'Dữ liệu Tri thức AI (RAG Knowledge)',
    subtitle: 'Giám sát và đồng bộ hóa dữ liệu văn bản, FAQ vào hệ thống trả lời tự động'
  },
  'audit-logs': {
    title: 'Lịch sử Cập nhật & Kiểm toán',
    subtitle: 'Nhật ký theo dõi mọi thay đổi về thủ tục, biểu mẫu, lệ phí và phiên bản'
  },
  profile: {
    title: 'Hồ sơ Chuyên viên Quản lý',
    subtitle: 'Thông tin phân quyền, chữ ký số nội bộ và tài khoản quản trị nghiệp vụ'
  }
};

export const ProcedureManagerHeader: React.FC<ProcedureManagerHeaderProps> = ({
  currentSection,
  onOpenMobileSidebar,
  isCollapsedDesktop,
  onToggleCollapseDesktop,
  onAddNewProcedure,
  searchQuery = '',
  onSearchChange
}) => {
  const currentInfo = sectionTitles[currentSection] || {
    title: 'Quản lý Thủ tục Hành chính',
    subtitle: 'Cổng điều hành và chuẩn hóa nghiệp vụ Một cửa'
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white/95 px-4 shadow-sm backdrop-blur-md sm:px-6">
      {/* Left Area: Toggle + Title */}
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger */}
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="grid size-10 place-items-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 lg:hidden"
          aria-label="Mở menu điều hướng"
        >
          <List size={22} weight="bold" />
        </button>

        {/* Desktop Collapse Toggle */}
        <button
          type="button"
          onClick={onToggleCollapseDesktop}
          className="hidden size-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 lg:grid"
          title={isCollapsedDesktop ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
          aria-label="Thu gọn hoặc mở rộng thanh điều hướng"
        >
          <SidebarSimple size={20} weight="duotone" />
        </button>

        {/* Title */}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-base font-bold text-slate-950 sm:text-lg">
              {currentInfo.title}
            </h1>
            <span className="hidden rounded-md bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-800 sm:inline-block">
              Quản lý nghiệp vụ
            </span>
          </div>
          <p className="hidden truncate text-xs text-slate-500 md:block">
            {currentInfo.subtitle}
          </p>
        </div>
      </div>

      {/* Right Area: Search, Action, Notification, Profile badge */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Search */}
        {onSearchChange && (
          <div className="relative hidden sm:block">
            <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Tìm thủ tục, mã..."
              className="h-9 w-44 rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-red-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-100 md:w-56"
            />
          </div>
        )}

        {/* Primary Action: Add Procedure */}
        <button
          type="button"
          onClick={onAddNewProcedure}
          className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-gradient-to-r from-red-800 to-red-900 px-3.5 text-xs font-bold text-white shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-red-300"
          title="Thêm thủ tục hành chính mới"
        >
          <Plus size={16} weight="bold" />
          <span className="hidden sm:inline">Thêm thủ tục</span>
          <span className="sm:hidden">Thêm</span>
        </button>

        {/* AI Sync Indicator */}
        <div
          className="hidden items-center gap-1 rounded-lg border border-purple-200 bg-purple-50 px-2 py-1 text-[11px] font-semibold text-purple-800 lg:flex"
          title="Cơ sở tri thức AI đã đồng bộ 100%"
        >
          <Sparkle size={14} weight="fill" className="text-purple-600" />
          <span>AI Synced</span>
        </div>

        {/* Notification Bell */}
        <button
          type="button"
          className="relative grid size-9 place-items-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100"
          aria-label="Thông báo hệ thống"
        >
          <Bell size={18} />
          <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-red-600 ring-2 ring-white" />
        </button>

        {/* User Mini Avatar */}
        <div className="flex items-center gap-2 pl-1 sm:pl-2">
          <div className="grid size-9 shrink-0 place-items-center rounded-full bg-red-800 text-xs font-extrabold text-gold-300 shadow-inner">
            HN
          </div>
        </div>
      </div>
    </header>
  );
};
