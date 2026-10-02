import React from 'react';
import {
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
            <p>Thống kê hệ thống</p>
            <button
              type="button"
              className={currentSection === 'stats-dossiers' ? 'is-active' : ''}
              aria-current={currentSection === 'stats-dossiers' ? 'page' : undefined}
              onClick={() => handleNavClick('stats-dossiers')}
              title="Thống kê hồ sơ"
            >
              <Files size={20} />
              <span>Thống kê hồ sơ</span>
              <small>1.4k</small>
            </button>
            <button
              type="button"
              className={currentSection === 'stats-procedures' ? 'is-active' : ''}
              aria-current={currentSection === 'stats-procedures' ? 'page' : undefined}
              onClick={() => handleNavClick('stats-procedures')}
              title="Thống kê thủ tục"
            >
              <ClipboardText size={20} />
              <span>Thống kê thủ tục</span>
            </button>
            <button
              type="button"
              className={currentSection === 'stats-searches' ? 'is-active' : ''}
              aria-current={currentSection === 'stats-searches' ? 'page' : undefined}
              onClick={() => handleNavClick('stats-searches')}
              title="Thống kê lượt tra cứu"
            >
              <MagnifyingGlass size={20} />
              <span>Thống kê lượt tra cứu</span>
            </button>
            <button
              type="button"
              className={currentSection === 'stats-forms' ? 'is-active' : ''}
              aria-current={currentSection === 'stats-forms' ? 'page' : undefined}
              onClick={() => handleNavClick('stats-forms')}
              title="Thống kê biểu mẫu"
            >
              <FileText size={20} />
              <span>Thống kê biểu mẫu</span>
            </button>
          </div>

          <div className="admin-nav-section">
            <p>Hồ sơ công dân</p>
            <button
              type="button"
              className={currentSection === 'profiles' ? 'is-active' : ''}
              aria-current={currentSection === 'profiles' ? 'page' : undefined}
              onClick={() => handleNavClick('profiles')}
              title={`Hồ sơ công dân (${profilesCount})`}
            >
              <IdentificationCard size={20} />
              <span>Hồ sơ công dân</span>
              <small>{profilesCount}</small>
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

        </nav>

      </aside>
    </>
  );
};
