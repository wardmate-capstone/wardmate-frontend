import { UserDropdown } from '@/components/layout/UserDropdown';
import React from 'react';
import {
  List,
  SidebarSimple,
  Bell,
} from '@phosphor-icons/react';
import type { OfficerSection } from '@/types/officer';

interface OfficerHeaderProps {
  activeSection: OfficerSection;
  onOpenMobileMenu: () => void;
  isCompact: boolean;
  onToggleCompact: () => void;
  unreadNotifsCount: number;
  onOpenNotifications: () => void;
  breadcrumbs?: Array<{ label: string; onClick?: () => void }>;
}

const SECTION_TITLES: Record<OfficerSection, { title: string; subtitle?: string }> = {
  dashboard: { title: 'Tổng quan công việc Cán bộ Một cửa' },
  'apps-all': { title: 'Tất cả hồ sơ' },
  'apps-pending': { title: 'Hồ sơ chờ tiền kiểm' },
  'apps-reviewing': { title: 'Hồ sơ đang kiểm tra' },
  'apps-need-revision': { title: 'Hồ sơ cần bổ sung' },
  'apps-resubmitted': { title: 'Hồ sơ đã gửi lại' },
  'apps-approved': { title: 'Hồ sơ đã duyệt tiền kiểm' },
  'apps-ready-submit': { title: 'Chờ tiếp nhận chính thức' },
  'receipt-waiting': { title: 'Tiếp nhận hồ sơ tại quầy' },
  'receipt-received': { title: 'Hồ sơ đã tiếp nhận chính thức' },
  'audit-log': { title: 'Lịch sử xử lý của cán bộ' },
  notifications: { title: 'Thông báo ca trực' },
  profile: { title: 'Hồ sơ cá nhân' },
};

export const OfficerHeader: React.FC<OfficerHeaderProps> = ({
  activeSection,
  onOpenMobileMenu,
  isCompact,
  onToggleCompact,
  unreadNotifsCount,
  onOpenNotifications,
  breadcrumbs,
}) => {
  const currentMeta = SECTION_TITLES[activeSection] || SECTION_TITLES.dashboard;

  return (
    <header className="sticky top-0 z-30 flex min-h-[68px] items-center justify-between gap-4 border-b border-slate-200/90 bg-white/95 px-4 backdrop-blur-md sm:px-6">
      {/* Left controls & Breadcrumb */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Mobile menu trigger */}
        <button
          type="button"
          className="grid size-10 place-items-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 lg:hidden"
          onClick={onOpenMobileMenu}
          aria-label="Mở menu điều hướng cán bộ"
        >
          <List size={22} weight="bold" />
        </button>

        {/* Desktop compact sidebar toggle */}
        <button
          type="button"
          className="hidden lg:grid size-10 place-items-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
          onClick={onToggleCompact}
          aria-label={isCompact ? 'Mở rộng thanh điều hướng' : 'Thu gọn thanh điều hướng'}
        >
          <SidebarSimple size={20} className={isCompact ? 'rotate-180' : ''} />
        </button>

        {/* Breadcrumb tương tự Manager */}
        <div className="flex items-center gap-2 min-w-0 pl-0.5 sm:pl-1">
          <span className="hidden sm:inline-flex items-center text-xs font-semibold text-slate-400">
            Cán bộ
          </span>
          <span className="hidden sm:inline text-slate-300 text-xs select-none">/</span>
          {breadcrumbs && breadcrumbs.length > 0 ? (
            <div className="flex items-center gap-2 min-w-0">
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={crumb.label}>
                  {idx > 0 && <span className="text-slate-300 text-xs select-none">/</span>}
                  {crumb.onClick ? (
                    <button
                      type="button"
                      onClick={crumb.onClick}
                      className="hover:text-red-800 hover:underline font-medium text-slate-600 text-xs sm:text-sm truncate"
                    >
                      {crumb.label}
                    </button>
                  ) : (
                    <span className="text-xs sm:text-sm font-bold text-slate-900 truncate max-w-[170px] sm:max-w-[280px] md:max-w-[360px]">
                      {crumb.label}
                    </span>
                  )}
                </React.Fragment>
              ))}
            </div>
          ) : (
            <span className="text-xs sm:text-sm font-bold text-slate-900 truncate max-w-[170px] sm:max-w-[280px] md:max-w-[360px]">
              {currentMeta.title}
            </span>
          )}
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Notification Bell */}
        <button
          type="button"
          onClick={onOpenNotifications}
          className="relative grid size-10 place-items-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          aria-label={
            unreadNotifsCount > 0
              ? `Thông báo ca trực, có ${unreadNotifsCount} thông báo mới`
              : 'Thông báo ca trực'
          }
        >
          <Bell size={20} />
          {unreadNotifsCount > 0 && (
            <span className="absolute -top-1 -right-1 grid min-w-5 place-items-center rounded-full bg-red-600 px-1 py-0.5 text-[10px] font-bold text-white ring-2 ring-white">
              {unreadNotifsCount}
            </span>
          )}
        </button>

        <UserDropdown />
      </div>
    </header>
  );
};
