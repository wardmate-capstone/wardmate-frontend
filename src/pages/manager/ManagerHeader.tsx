import React from 'react';
import {
  List,
  SidebarSimple,
  Bell,
  MagnifyingGlass,
  ArrowSquareOut,
} from '@phosphor-icons/react';
import { ManagerSectionId } from './types';

export const managerSectionTitles: Record<ManagerSectionId, { title: string; subtitle?: string }> = {
  dashboard: { title: 'Tổng quan Điều hành', subtitle: 'Theo dõi tình hình giải quyết TTHC và hoạt động Bộ phận Một cửa' },
  profiles: { title: 'Quản lý Hồ sơ Công dân', subtitle: 'Cơ sở dữ liệu định danh và thông tin công dân trên địa bàn' },
  'stats-dossiers': { title: 'Thống kê Hồ sơ Hành chính', subtitle: 'Phân tích số lượng tiếp nhận, giải quyết đúng hạn và tồn đọng' },
  'stats-procedures': { title: 'Thống kê Thủ tục Hành chính', subtitle: 'Tần suất giải quyết và thời gian xử lý theo từng thủ tục' },
  'stats-searches': { title: 'Thống kê Lượt tra cứu', subtitle: 'Lưu lượng tìm kiếm và quan tâm của người dân qua cổng trực tuyến' },
  'stats-forms': { title: 'Thống kê Biểu mẫu & E-Form', subtitle: 'Tình hình sử dụng, tải mẫu đơn và kê khai trực tuyến' },
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
    <header className="admin-header">
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="admin-menu-toggle"
          onClick={onOpenMobileSidebar}
          aria-label="Mở menu điều hướng"
          aria-controls="manager-sidebar"
        >
          <List size={23} />
        </button>

        <button
          type="button"
          className={`admin-collapse-button ${isCollapsedDesktop ? 'is-collapsed' : ''}`}
          onClick={onToggleCollapseDesktop}
          aria-label="Thu gọn hoặc mở rộng thanh điều hướng"
          aria-controls="manager-sidebar"
          aria-expanded={!isCollapsedDesktop}
        >
          <SidebarSimple size={21} />
        </button>

        <div className="admin-breadcrumb">
          <span>Quản lý</span>
          <span className="opacity-40">/</span>
          <strong>{currentMeta.title}</strong>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative hidden md:block w-64 lg:w-80">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm kiếm nhanh chỉ số, hồ sơ..."
            className="w-full h-10 pl-9 pr-4 text-xs bg-slate-100/80 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-800"
          />
          <MagnifyingGlass
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
        </div>

        {onExportReport && (
          <button
            type="button"
            className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-red-800"
            onClick={onExportReport}
          >
            <ArrowSquareOut size={16} />
            <span className="hidden sm:inline">Xuất báo cáo</span>
          </button>
        )}

        <button
          type="button"
          className="admin-notify-button relative"
          aria-label="Thông báo hệ thống"
        >
          <Bell size={20} />
          <span className="absolute top-2 right-2 size-2 bg-red-600 rounded-full" />
        </button>

        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <span className="size-8 rounded-full bg-red-900 text-white font-bold text-xs flex items-center justify-center">
            TH
          </span>
          <div className="hidden lg:block text-left">
            <p className="text-xs font-bold text-slate-800 leading-none">Nguyễn Thế Hùng</p>
            <p className="text-[10px] text-slate-500 mt-0.5 leading-none">Lãnh đạo UBND</p>
          </div>
        </div>
      </div>
    </header>
  );
};
