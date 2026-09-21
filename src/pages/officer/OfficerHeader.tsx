import React from 'react';
import {
  List,
  SidebarSimple,
  Bell,
  CaretRight,
  ShieldCheck,
  BuildingOffice,
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

const SECTION_TITLES: Record<OfficerSection, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Tổng quan công việc Cán bộ Một cửa',
    subtitle: 'Theo dõi tiến độ tiền kiểm, hàng đợi tiếp nhận và hiệu suất xử lý hồ sơ',
  },
  'apps-all': {
    title: 'Tất cả hồ sơ',
    subtitle: 'Danh mục toàn bộ hồ sơ đang lưu chuyển trên hệ thống',
  },
  'apps-pending': {
    title: 'Hồ sơ chờ tiền kiểm',
    subtitle: 'Các hồ sơ người dân vừa nộp điện tử cần cán bộ tiếp nhận kiểm tra',
  },
  'apps-reviewing': {
    title: 'Hồ sơ đang kiểm tra',
    subtitle: 'Danh sách hồ sơ bạn đã nhận xử lý và đang trong quá trình đối chiếu',
  },
  'apps-need-revision': {
    title: 'Hồ sơ cần bổ sung',
    subtitle: 'Các hồ sơ đã gửi yêu cầu chỉnh sửa và đang chờ người dân cập nhật',
  },
  'apps-resubmitted': {
    title: 'Hồ sơ đã gửi lại',
    subtitle: 'Người dân vừa hoàn thiện bổ sung thông tin theo yêu cầu, cần ưu tiên xem lại',
  },
  'apps-approved': {
    title: 'Hồ sơ đã duyệt tiền kiểm',
    subtitle: 'Hồ sơ điện tử hợp lệ, sẵn sàng để người dân đến cơ quan tiếp nhận',
  },
  'apps-ready-submit': {
    title: 'Chờ tiếp nhận chính thức',
    subtitle: 'Người dân đã hoàn thiện hồ sơ và chuẩn bị đến nộp trực tiếp tại quầy',
  },
  'receipt-waiting': {
    title: 'Tiếp nhận hồ sơ tại quầy',
    subtitle: 'Tra cứu hồ sơ đã duyệt, đối chiếu giấy tờ thực tế và xác nhận tiếp nhận',
  },
  'receipt-received': {
    title: 'Hồ sơ đã tiếp nhận chính thức',
    subtitle: 'Lưu trữ các hồ sơ đã hoàn thành tiếp nhận tại bộ phận Một cửa',
  },
  'audit-log': {
    title: 'Lịch sử xử lý của cán bộ',
    subtitle: 'Nhật ký các thao tác tiếp nhận, đánh giá và giải quyết hồ sơ trong ca trực',
  },
  notifications: {
    title: 'Thông báo ca trực',
    subtitle: 'Cập nhật biến động hồ sơ và thông tin điều hành nội bộ',
  },
  profile: {
    title: 'Hồ sơ cá nhân & Quầy trực',
    subtitle: 'Thông tin phân công nhiệm vụ, quầy làm việc và ca trực',
  },
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
    <header className="sticky top-0 z-30 flex min-h-[72px] items-center justify-between gap-4 border-b border-slate-200 bg-white/95 px-4 backdrop-blur-md sm:px-6">
      {/* Left controls & Breadcrumb */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Mobile menu trigger */}
        <button
          type="button"
          className="grid size-11 place-items-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 lg:hidden"
          onClick={onOpenMobileMenu}
          aria-label="Mở menu điều hướng cán bộ"
        >
          <List size={22} aria-hidden="true" />
        </button>

        {/* Desktop compact sidebar toggle */}
        <button
          type="button"
          className="hidden lg:grid size-10 place-items-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
          onClick={onToggleCompact}
          aria-label={isCompact ? 'Mở rộng thanh điều hướng' : 'Thu gọn thanh điều hướng'}
        >
          <SidebarSimple size={20} className={isCompact ? 'rotate-180' : ''} aria-hidden="true" />
        </button>

        {/* Desk / Department Badge & Breadcrumb */}
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <BuildingOffice size={16} className="text-red-800 shrink-0" aria-hidden="true" />
            <span className="truncate font-semibold text-slate-700">UBND Phường An Khánh · Quầy số 02</span>
            <span className="hidden md:inline text-slate-300">|</span>
            <span className="hidden md:inline-flex items-center gap-1 text-emerald-700 font-medium">
              <ShieldCheck size={14} aria-hidden="true" /> Tiền kiểm hồ sơ Một cửa
            </span>
          </div>

          {breadcrumbs && breadcrumbs.length > 0 ? (
            <nav className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5" aria-label="Breadcrumb">
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={crumb.label}>
                  {idx > 0 && <CaretRight size={12} className="text-slate-400" aria-hidden="true" />}
                  {crumb.onClick ? (
                    <button
                      type="button"
                      onClick={crumb.onClick}
                      className="hover:text-red-800 hover:underline font-medium text-slate-600"
                    >
                      {crumb.label}
                    </button>
                  ) : (
                    <span className="font-bold text-slate-900">{crumb.label}</span>
                  )}
                </React.Fragment>
              ))}
            </nav>
          ) : (
            <p className="text-xs font-bold text-slate-900 truncate mt-0.5">
              {currentMeta.title}
            </p>
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
          <Bell size={20} aria-hidden="true" />
          {unreadNotifsCount > 0 && (
            <span className="absolute -top-1 -right-1 grid min-w-5 place-items-center rounded-full bg-red-600 px-1 py-0.5 text-[10px] font-bold text-white ring-2 ring-white">
              {unreadNotifsCount}
            </span>
          )}
        </button>

        {/* Officer Badge */}
        <div className="hidden sm:flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5">
          <span className="grid size-7 place-items-center rounded-full bg-red-800 text-[11px] font-bold text-white">
            TH
          </span>
          <div className="text-left">
            <span className="block text-xs font-bold text-slate-900 leading-tight">Lê Thu Hà</span>
            <span className="block text-[10px] text-emerald-700 font-semibold leading-tight">● Đang trực quầy</span>
          </div>
        </div>
      </div>
    </header>
  );
};
