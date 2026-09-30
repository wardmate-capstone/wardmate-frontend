import React from 'react';
import {
  List,
  SidebarSimple,
  Bell,
  MagnifyingGlass,
  ArrowSquareOut,
  CaretDown,
} from '@phosphor-icons/react';
import { ManagerSectionId } from './types';

export const managerSectionTitles: Record<ManagerSectionId, { title: string; subtitle?: string }> = {
  'stats-dossiers': { title: 'Thống kê Hồ sơ Hành chính', subtitle: 'Phân tích số lượng tiếp nhận, giải quyết đúng hạn và tồn đọng' },
  'stats-procedures': { title: 'Thống kê Thủ tục Hành chính', subtitle: 'Tần suất giải quyết và thời gian xử lý theo từng thủ tục' },
  'stats-searches': { title: 'Thống kê Lượt tra cứu', subtitle: 'Lưu lượng tìm kiếm và quan tâm của người dân qua cổng trực tuyến' },
  'stats-forms': { title: 'Thống kê Biểu mẫu & E-Form', subtitle: 'Tình hình sử dụng, tải mẫu đơn và kê khai trực tuyến' },
  profiles: { title: 'Quản lý Hồ sơ Công dân', subtitle: 'Cơ sở dữ liệu định danh và thông tin công dân trên địa bàn' },
  'perf-processing-time': { title: 'Hiệu suất Thời gian Xử lý', subtitle: 'So sánh thời gian giải quyết thực tế so với quy định pháp luật' },
  'perf-completion-rate': { title: 'Tỷ lệ Hoàn thành Hồ sơ', subtitle: 'Tỷ lệ giải quyết trước hạn, đúng hạn và trả kết quả thành công' },
  'perf-supplement-rate': { title: 'Tỷ lệ Cần bổ sung Hồ sơ', subtitle: 'Thống kê hồ sơ chưa đạt chuẩn và phân tích nguyên nhân lỗi' },
  'perf-officers': { title: 'Đánh giá Hiệu suất Cán bộ', subtitle: 'Năng suất tiếp nhận, giải quyết hồ sơ và điểm hài lòng của cán bộ Một cửa' },
  'feedback-reports': { title: 'Báo cáo Phản hồi Người dân', subtitle: 'Tiếp nhận và xử lý góp ý, phản ánh kiến nghị từ công dân' },
  'satisfaction-level': { title: 'Đánh giá Mức độ Hài lòng', subtitle: 'Kết quả khảo sát chất lượng dịch vụ hành chính công của phường' },
  reports: { title: 'Báo cáo Tổng hợp', subtitle: 'Kết xuất báo cáo định kỳ theo mẫu chuẩn của UBND cấp trên' },
  permissions: { title: 'Cài đặt Phân quyền', subtitle: 'Quản lý vai trò và quyền truy cập các chức năng trong hệ thống' },
  profile: { title: 'Hồ sơ Cá nhân', subtitle: 'Thông tin tài khoản quản trị và thiết lập bảo mật cá nhân' },
};

interface ManagerHeaderProps {
  currentSection: ManagerSectionId;
  onOpenMobileSidebar: () => void;
  isCollapsedDesktop: boolean;
  onToggleCollapseDesktop: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onExportReport?: () => void;
}

export const ManagerHeader: React.FC<ManagerHeaderProps> = ({
  currentSection,
  onOpenMobileSidebar,
  isCollapsedDesktop,
  onToggleCollapseDesktop,
  searchQuery,
  onSearchChange,
  onExportReport,
}) => {
  const currentMeta = managerSectionTitles[currentSection] || {
    title: 'Cổng Quản lý Điều hành',
    subtitle: 'Hệ thống Quản lý và Hỗ trợ TTHC WardMate',
  };

  return (
    <header className="admin-topbar sticky top-0 z-30 flex min-h-[68px] items-center justify-between border-b border-slate-200/90 bg-white/95 px-4 backdrop-blur-md sm:px-6">
      {/* Cụm trái: Toggle menu & Breadcrumb */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          type="button"
          className="admin-menu-toggle"
          onClick={onOpenMobileSidebar}
          aria-label="Mở menu điều hướng"
          aria-controls="manager-sidebar"
        >
          <List size={22} weight="bold" />
        </button>

        <button
          type="button"
          className={`admin-collapse-button ${isCollapsedDesktop ? 'is-collapsed' : ''}`}
          onClick={onToggleCollapseDesktop}
          aria-label="Thu gọn hoặc mở rộng thanh điều hướng"
          aria-controls="manager-sidebar"
          aria-expanded={!isCollapsedDesktop}
        >
          <SidebarSimple size={20} />
        </button>

        <div className="flex items-center gap-2 min-w-0 pl-0.5 sm:pl-1">
          <span className="hidden sm:inline-flex items-center text-xs font-semibold text-slate-400">
            Quản lý
          </span>
          <span className="hidden sm:inline text-slate-300 text-xs select-none">/</span>
          <span className="text-xs sm:text-sm font-bold text-slate-900 truncate max-w-[170px] sm:max-w-[280px] md:max-w-[360px]">
            {currentMeta.title}
          </span>
        </div>
      </div>

      {/* Cụm phải: Search, Action, Thông báo, User Pill */}
      <div className="admin-topbar-actions ml-auto flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Ô tìm kiếm nhanh */}
        <div className="relative hidden md:block w-48 lg:w-60 xl:w-72">
          <MagnifyingGlass
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm kiếm nhanh chỉ số, hồ sơ..."
            className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50/90 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 transition-colors hover:bg-slate-100/70 focus:border-red-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-700/15"
          />
        </div>

        {/* Nút xuất báo cáo nhanh */}
        {onExportReport && (
          <button
            type="button"
            className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 shadow-2xs transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-900 shrink-0"
            onClick={onExportReport}
            title="Xuất báo cáo tổng hợp"
          >
            <ArrowSquareOut size={16} className="text-slate-500" />
            <span className="hidden sm:inline">Xuất báo cáo</span>
          </button>
        )}

        {/* Nút thông báo chuông */}
        <button
          type="button"
          className="relative grid size-10 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-2xs transition-colors hover:bg-slate-50 hover:text-red-800"
          aria-label="Thông báo hệ thống"
          title="Thông báo"
        >
          <Bell size={19} />
          <span className="absolute top-2 right-2 size-2 rounded-full bg-red-600 ring-2 ring-white" />
        </button>

        {/* Divider ngăn cách nhẹ */}
        <div className="h-6 w-px bg-slate-200 hidden sm:block mx-0.5" />

        {/* Cụm thông tin người dùng / avatar */}
        <div className="admin-user-button select-none cursor-default py-1">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-red-900 text-[11px] font-bold text-white shadow-xs">
            TH
          </span>
          <div className="hidden min-w-0 sm:block text-left">
            <strong className="block text-xs font-bold text-slate-900 leading-tight">
              Nguyễn Thế Hùng
            </strong>
            <small className="block text-[10px] text-slate-500 leading-tight mt-0.5 font-medium">
              Lãnh đạo UBND
            </small>
          </div>
          <CaretDown size={14} className="hidden sm:block text-slate-400 ml-0.5" />
        </div>
      </div>
    </header>
  );
};
