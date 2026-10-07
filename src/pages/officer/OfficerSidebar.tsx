import React, { useState } from 'react';
import {
  House,
  Files,
  ClockCounterClockwise,
  Hourglass,
  WarningCircle,
  ArrowCounterClockwise,
  CheckCircle,
  FileText,
  ClipboardText,
  Tray,
  Bell,
  UserCircle,
  X,
  CaretDown,
} from '@phosphor-icons/react';
import { BrandMark } from '@/components/brand/BrandMark';
import { BrandWordmark } from '@/components/brand/BrandWordmark';
import type { OfficerSection } from '@/types/officer';

interface OfficerSidebarProps {
  activeSection: OfficerSection;
  onSelectSection: (section: OfficerSection) => void;
  isOpen: boolean;
  onClose: () => void;
  isCompact: boolean;
  badgeCounts: {
    pending: number;
    reviewing: number;
    needRevision: number;
    resubmitted: number;
    approved: number;
    readySubmit: number;
    receivedToday: number;
    unreadNotifs: number;
  };
}

export const OfficerSidebar: React.FC<OfficerSidebarProps> = ({
  activeSection,
  onSelectSection,
  isOpen,
  onClose,
  isCompact,
  badgeCounts,
}) => {
  const isDossierActive = activeSection.startsWith('apps-');
  const [isDossiersExpanded, setIsDossiersExpanded] = useState(true);

  const totalDossiersCount =
    badgeCounts.pending +
    badgeCounts.reviewing +
    badgeCounts.needRevision +
    badgeCounts.resubmitted +
    badgeCounts.approved +
    badgeCounts.readySubmit;

  const navSections = [
    {
      group: 'Tổng quan',
      items: [
        {
          id: 'dashboard' as OfficerSection,
          label: 'Tổng quan',
          icon: House,
        },
      ],
    },
    {
      group: 'Tiếp nhận hồ sơ',
      items: [
        {
          id: 'receipt-waiting' as OfficerSection,
          label: 'Chờ tiếp nhận',
          icon: ClipboardText,
          badge: badgeCounts.readySubmit,
          badgeTone: 'bg-teal-100 text-teal-900 border-teal-200',
        },
        {
          id: 'receipt-received' as OfficerSection,
          label: 'Đã tiếp nhận',
          icon: Tray,
          badge: badgeCounts.receivedToday,
          badgeTone: 'bg-slate-100 text-slate-800 border-slate-200',
        },
      ],
    },
    {
      group: 'Hệ thống & Ca trực',
      items: [
        {
          id: 'audit-log' as OfficerSection,
          label: 'Lịch sử xử lý',
          icon: ClockCounterClockwise,
        },
        {
          id: 'notifications' as OfficerSection,
          label: 'Thông báo',
          icon: Bell,
          badge: badgeCounts.unreadNotifs > 0 ? badgeCounts.unreadNotifs : undefined,
          badgeTone: 'bg-red-600 text-white font-bold',
        },
        {
          id: 'profile' as OfficerSection,
          label: 'Hồ sơ cá nhân',
          icon: UserCircle,
        },
      ],
    },
  ];

  const dossierSubItems = [
    {
      id: 'apps-all' as OfficerSection,
      label: 'Tất cả hồ sơ',
      icon: Files,
    },
    {
      id: 'apps-pending' as OfficerSection,
      label: 'Chờ tiền kiểm',
      icon: Hourglass,
      badge: badgeCounts.pending,
      badgeTone: 'bg-amber-100 text-amber-900 border-amber-200',
    },
    {
      id: 'apps-reviewing' as OfficerSection,
      label: 'Đang kiểm tra',
      icon: ClockCounterClockwise,
      badge: badgeCounts.reviewing,
      badgeTone: 'bg-blue-100 text-blue-900 border-blue-200',
    },
    {
      id: 'apps-need-revision' as OfficerSection,
      label: 'Cần bổ sung',
      icon: WarningCircle,
      badge: badgeCounts.needRevision,
      badgeTone: 'bg-rose-100 text-rose-900 border-rose-200',
    },
    {
      id: 'apps-resubmitted' as OfficerSection,
      label: 'Đã gửi lại',
      icon: ArrowCounterClockwise,
      badge: badgeCounts.resubmitted,
      badgeTone: 'bg-purple-100 text-purple-900 border-purple-200 font-bold',
    },
    {
      id: 'apps-approved' as OfficerSection,
      label: 'Đã duyệt tiền kiểm',
      icon: CheckCircle,
      badge: badgeCounts.approved,
      badgeTone: 'bg-emerald-100 text-emerald-900 border-emerald-200',
    },
    {
      id: 'apps-ready-submit' as OfficerSection,
      label: 'Chờ tiếp nhận chính thức',
      icon: FileText,
      badge: badgeCounts.readySubmit,
      badgeTone: 'bg-teal-100 text-teal-900 border-teal-200',
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Semantic Sidebar */}
      <aside
        id="officer-sidebar"
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-200 bg-white transition-all duration-300 ease-in-out shadow-2xl lg:shadow-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 ${isCompact ? 'w-20' : 'w-72'}`}
        aria-label="Thanh điều hướng Cán bộ Một cửa"
      >
        {/* Brand Header */}
        <header className="flex h-18 shrink-0 items-center justify-between border-b border-slate-100 px-4">
          <div className="flex items-center gap-3 min-w-0">
            <BrandMark className="size-10 shrink-0 drop-shadow-sm" size={40} />
            {!isCompact && (
              <div className="min-w-0 flex-1 overflow-hidden">
                <BrandWordmark subtitle="Cán bộ Một cửa" compact />
              </div>
            )}
          </div>
          <button
            type="button"
            className="grid size-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 lg:hidden"
            onClick={onClose}
            aria-label="Đóng menu điều hướng"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </header>

        {/* Navigation Content */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5" aria-label="Chức năng nghiệp vụ">
          {/* Nhóm 1: Tổng quan */}
          <div className="space-y-1">
            {!isCompact && (
              <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Tổng quan
              </p>
            )}
            <button
              type="button"
              onClick={() => {
                onSelectSection('dashboard');
                onClose();
              }}
              title={isCompact ? 'Tổng quan' : undefined}
              aria-current={activeSection === 'dashboard' ? 'page' : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-sm transition-colors text-left ${
                activeSection === 'dashboard'
                  ? 'bg-red-50 text-red-900 border-l-4 border-red-700 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              } ${isCompact ? 'justify-center px-0' : ''}`}
            >
              <House
                size={20}
                weight={activeSection === 'dashboard' ? 'bold' : 'regular'}
                className={activeSection === 'dashboard' ? 'text-red-700 shrink-0' : 'text-slate-500 shrink-0'}
                aria-hidden="true"
              />
              {!isCompact && <span className="min-w-0 flex-1 truncate">Tổng quan</span>}
            </button>
          </div>

          {/* Nhóm 2: Quản lý hồ sơ (Có phần thu gọn / mở rộng như trang Citizen) */}
          <div className="space-y-1">
            {!isCompact && (
              <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Quản lý hồ sơ
              </p>
            )}

            {/* Mục cha: Quản lý hồ sơ với nút thu gọn / mở rộng */}
            <button
              type="button"
              onClick={() => {
                if (isCompact) {
                  onSelectSection('apps-all');
                  onClose();
                } else {
                  setIsDossiersExpanded((prev) => !prev);
                }
              }}
              title={isCompact ? 'Quản lý hồ sơ' : undefined}
              aria-expanded={isDossiersExpanded}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-sm transition-colors text-left ${
                isDossierActive
                  ? 'bg-red-50/80 text-red-950 font-bold'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950'
              } ${isCompact ? 'justify-center px-0' : ''}`}
            >
              <Files
                size={20}
                weight={isDossierActive ? 'bold' : 'regular'}
                className={isDossierActive ? 'text-red-700 shrink-0' : 'text-slate-600 shrink-0'}
                aria-hidden="true"
              />
              {!isCompact && (
                <>
                  <span className="min-w-0 flex-1 truncate">Hồ sơ nghiệp vụ</span>
                  {totalDossiersCount > 0 && (
                    <span className="grid min-w-6 place-items-center rounded-full bg-slate-200/80 px-1.5 py-0.5 text-[10px] font-bold text-slate-700">
                      {totalDossiersCount}
                    </span>
                  )}
                  <CaretDown
                    size={14}
                    className={`text-slate-400 transition-transform duration-200 shrink-0 ${
                      isDossiersExpanded ? '' : '-rotate-90'
                    }`}
                  />
                </>
              )}
            </button>

            {/* Danh sách mục con khi mở rộng (hoặc khi sidebar ở chế độ thu nhỏ) */}
            {(isDossiersExpanded || isCompact) && (
              <div className={isCompact ? 'space-y-1' : 'my-1 ml-4 flex flex-col space-y-1 border-l-2 border-slate-200 pl-2'}>
                {dossierSubItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onSelectSection(item.id);
                        onClose();
                      }}
                      title={isCompact ? item.label : undefined}
                      aria-current={isActive ? 'page' : undefined}
                      className={`w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-semibold transition-colors text-left ${
                        isActive
                          ? 'bg-red-50 text-red-900 border-l-3 border-red-700 font-bold shadow-xs'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                      } ${isCompact ? 'justify-center px-0 py-2.5 rounded-xl' : ''}`}
                    >
                      <Icon
                        size={isCompact ? 20 : 16}
                        weight={isActive ? 'bold' : 'regular'}
                        className={isActive ? 'text-red-700 shrink-0' : 'text-slate-500 shrink-0'}
                        aria-hidden="true"
                      />
                      {!isCompact && (
                        <>
                          <span className="min-w-0 flex-1 truncate">{item.label}</span>
                          {item.badge !== undefined && (
                            <span
                              className={`px-1.5 py-0.5 text-[10px] rounded-full border shrink-0 tabular-nums ${
                                item.badgeTone || 'bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Các nhóm chức năng còn lại: Tiếp nhận & Hệ thống */}
          {navSections.slice(1).map((section) => (
            <div key={section.group} className="space-y-1">
              {!isCompact && (
                <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  {section.group}
                </p>
              )}
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onSelectSection(item.id);
                      onClose();
                    }}
                    title={isCompact ? item.label : undefined}
                    aria-current={isActive ? 'page' : undefined}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-sm transition-colors text-left ${
                      isActive
                        ? 'bg-red-50 text-red-900 border-l-4 border-red-700 shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    } ${isCompact ? 'justify-center px-0' : ''}`}
                  >
                    <Icon
                      size={20}
                      weight={isActive ? 'bold' : 'regular'}
                      className={isActive ? 'text-red-700 shrink-0' : 'text-slate-500 shrink-0'}
                      aria-hidden="true"
                    />
                    {!isCompact && (
                      <>
                        <span className="min-w-0 flex-1 truncate">{item.label}</span>
                        {item.badge !== undefined && (
                          <span
                            className={`px-2 py-0.5 text-xs rounded-full border shrink-0 tabular-nums ${
                              item.badgeTone || 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

      </aside>
    </>
  );
};
