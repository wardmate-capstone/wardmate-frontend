import { UserDropdown } from '@/components/layout/UserDropdown';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import React from 'react';
import {
  List,
  SidebarSimple,
} from '@phosphor-icons/react';
import { ManagerSectionId } from './types';

export const managerSectionTitles: Record<ManagerSectionId, { title: string; subtitle?: string }> = {
  overview: { title: 'Tổng quan điều hành', subtitle: 'Tình hình tiền kiểm và phản hồi người dân trong phường' },
  applications: { title: 'Giám sát hồ sơ', subtitle: 'Theo dõi hồ sơ toàn phường, giao và chuyển cán bộ phụ trách' },
  'stats-dossiers': { title: 'Thống kê Hồ sơ Hành chính', subtitle: 'Số lượt gửi tiền kiểm, giấy tờ sẵn sàng và hồ sơ còn tồn' },
  'stats-procedures': { title: 'Thống kê Thủ tục Hành chính', subtitle: 'Tần suất giải quyết và thời gian xử lý theo từng thủ tục' },
  profiles: { title: 'Quản lý Cán bộ Một cửa', subtitle: 'Danh sách và hồ sơ nhân sự tiếp nhận hồ sơ tại bộ phận Một cửa cấp phường' },
  'perf-officers': { title: 'Đánh giá Hiệu suất Cán bộ', subtitle: 'Số giấy tờ sẵn sàng, yêu cầu bổ sung và thời hạn tiền kiểm theo cán bộ' },
  'feedback-reports': { title: 'Báo cáo Phản hồi Người dân', subtitle: 'Theo dõi đánh giá hỗ trợ tiền kiểm của người dân trong phường' },
  'satisfaction-level': { title: 'Đánh giá Mức độ Hài lòng', subtitle: 'Kết quả khảo sát chất lượng dịch vụ hành chính công của phường' },
  profile: { title: 'Hồ sơ Cá nhân', subtitle: 'Thông tin tài khoản quản trị và thiết lập bảo mật cá nhân' },
};

interface ManagerHeaderProps {
  currentSection: ManagerSectionId;
  onOpenMobileSidebar: () => void;
  isCollapsedDesktop: boolean;
  onToggleCollapseDesktop: () => void;
}

export const ManagerHeader: React.FC<ManagerHeaderProps> = ({
  currentSection,
  onOpenMobileSidebar,
  isCollapsedDesktop,
  onToggleCollapseDesktop,
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

      {/* Cụm phải: Thông báo, User Pill */}
      <div className="admin-topbar-actions ml-auto flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Nút thông báo chuông */}
        <NotificationBell />

        {/* Divider ngăn cách nhẹ */}
        <div className="h-6 w-px bg-slate-200 hidden sm:block mx-0.5" />

        {/* Cụm thông tin người dùng / avatar */}
        <UserDropdown />
      </div>
    </header>
  );
};
