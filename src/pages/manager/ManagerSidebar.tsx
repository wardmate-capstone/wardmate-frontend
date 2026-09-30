import React from 'react';
import {
  House,
  IdentificationCard,
  Files,
  ClipboardText,
  MagnifyingGlass,
  FileText,
  Clock,
  CheckCircle,
  WarningCircle,
  UsersThree,
  ChatTeardropDots,
  ThumbsUp,
  PresentationChart,
  ShieldCheck,
  UserCircle,
  SignOut,
  X,
} from '@phosphor-icons/react';
import { BrandMark } from '@/components/brand/BrandMark';
import { BrandWordmark } from '@/components/brand/BrandWordmark';
import { ManagerSectionId } from './types';

interface ManagerSidebarProps {
  currentSection: ManagerSectionId;
  onSelectSection: (section: ManagerSectionId) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  isCollapsedDesktop: boolean;
  onToggleCollapseDesktop: () => void;
  profilesCount?: number;
}

export const ManagerSidebar: React.FC<ManagerSidebarProps> = ({
  currentSection,
  onSelectSection,
  isOpenMobile,
  onCloseMobile,
  isCollapsedDesktop,
  profilesCount = 6,
}) => {
  const handleNavClick = (section: ManagerSectionId) => {
    onSelectSection(section);
    onCloseMobile();
  };

  const navGroups = [
    {
      title: 'Quản lý thông tin',
      items: [
        {
          id: 'profiles' as ManagerSectionId,
          label: 'Hồ sơ công dân',
          icon: IdentificationCard,
          badge: `${profilesCount}`,
          badgeColor: 'bg-red-100 text-red-800',
        },
      ],
    },
    {
      title: 'Thống kê hệ thống',
      items: [
        {
          id: 'stats-dossiers' as ManagerSectionId,
          label: 'Thống kê hồ sơ',
          icon: Files,
          badge: '1.4k',
        },
        {
          id: 'stats-procedures' as ManagerSectionId,
          label: 'Thống kê thủ tục',
          icon: ClipboardText,
        },
        {
          id: 'stats-searches' as ManagerSectionId,
          label: 'Thống kê lượt tra cứu',
          icon: MagnifyingGlass,
        },
        {
          id: 'stats-forms' as ManagerSectionId,
          label: 'Thống kê biểu mẫu',
          icon: FileText,
        },
      ],
    },
    {
      title: 'Hiệu suất xử lý',
      items: [
        {
          id: 'perf-processing-time' as ManagerSectionId,
          label: 'Thời gian xử lý',
          icon: Clock,
        },
        {
          id: 'perf-completion-rate' as ManagerSectionId,
          label: 'Tỷ lệ hoàn thành',
          icon: CheckCircle,
          badge: '98.6%',
          badgeColor: 'bg-emerald-100 text-emerald-800',
        },
        {
          id: 'perf-supplement-rate' as ManagerSectionId,
          label: 'Tỷ lệ cần bổ sung',
          icon: WarningCircle,
        },
        {
          id: 'perf-officers' as ManagerSectionId,
          label: 'Hiệu suất cán bộ',
          icon: UsersThree,
        },
      ],
    },
    {
      title: 'Phản hồi người dân',
      items: [
        {
          id: 'feedback-reports' as ManagerSectionId,
          label: 'Báo cáo phản hồi',
          icon: ChatTeardropDots,
          badge: '4 mới',
          badgeColor: 'bg-blue-100 text-blue-800',
        },
        {
          id: 'satisfaction-level' as ManagerSectionId,
          label: 'Mức độ hài lòng',
          icon: ThumbsUp,
        },
      ],
    },
    {
      title: 'Báo cáo & Thiết lập',
      items: [
        {
          id: 'reports' as ManagerSectionId,
          label: 'Báo cáo tổng hợp',
          icon: PresentationChart,
        },
        {
          id: 'permissions' as ManagerSectionId,
          label: 'Cài đặt quyền',
          icon: ShieldCheck,
        },
        {
          id: 'profile' as ManagerSectionId,
          label: 'Hồ sơ cá nhân',
          icon: UserCircle,
        },
      ],
    },
  ];

  return (
    <>
      {isOpenMobile && (
        <button
          type="button"
          className="admin-sidebar-overlay"
          onClick={onCloseMobile}
          aria-label="Đóng menu điều hướng"
        />
      )}

      <aside
        id="manager-sidebar"
        className={`admin-sidebar ${isOpenMobile ? 'is-open' : ''} ${
          isCollapsedDesktop ? 'is-compact' : ''
        }`}
        aria-label="Điều hướng Quản lý Điều hành"
      >
        <div className="admin-brand">
          <BrandMark className="admin-brand-mark" size={42} />
          <div>
            <BrandWordmark subtitle="Quản lý điều hành" compact />
          </div>
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Đóng menu"
          >
            <X size={21} />
          </button>
        </div>

        <nav className="admin-nav">
          <div className="admin-nav-section">
            <p>Tổng quan</p>
            <button
              type="button"
              className={currentSection === 'dashboard' ? 'is-active' : ''}
              aria-current={currentSection === 'dashboard' ? 'page' : undefined}
              onClick={() => handleNavClick('dashboard')}
              title="Dashboard"
            >
              <House size={20} />
              <span>Dashboard</span>
            </button>
          </div>

          {navGroups.map((group) => (
            <div className="admin-nav-section" key={group.title}>
              <p>{group.title}</p>
              {group.items.map(({ id, label, icon: Icon, badge }) => (
                <button
                  key={id}
                  type="button"
                  className={currentSection === id ? 'is-active' : ''}
                  aria-current={currentSection === id ? 'page' : undefined}
                  onClick={() => handleNavClick(id)}
                  title={badge ? `${label} (${badge})` : label}
                  aria-label={label}
                >
                  <Icon size={20} aria-hidden="true" />
                  <span>{label}</span>
                  {badge && <small>{badge}</small>}
                </button>
              ))}
            </div>
          ))}

          <div className="admin-nav-section">
            <p>Hệ thống</p>
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Bạn có chắc chắn muốn đăng xuất khỏi cổng Quản lý Điều hành?')) {
                  window.location.href = '/dang-nhap';
                }
              }}
              title="Đăng xuất"
              aria-label="Đăng xuất khỏi hệ thống"
            >
              <SignOut size={20} />
              <span>Đăng xuất</span>
            </button>
          </div>
        </nav>

        <div className="admin-sidebar-user">
          <span>TH</span>
          <div>
            <strong>Nguyễn Thế Hùng</strong>
            <small>Phó Chủ tịch UBND Phường</small>
          </div>
        </div>
      </aside>
    </>
  );
};
