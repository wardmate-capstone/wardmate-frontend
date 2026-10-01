import { BrandMark } from '@/components/brand/BrandMark';
import { BrandWordmark } from '@/components/brand/BrandWordmark';
import { useLogout } from '@/hooks/useLogout';
import {
  SquaresFour,
  Files,
  FolderSimple,
  ListChecks,
  Path,
  FileText,
  ClockCounterClockwise,
  Scales,
  LinkBreak,
  Brain,
  Article,
  UserGear,
  SignOut,
  X,
  UploadSimple,
  LinkSimple
} from '@phosphor-icons/react';

export type ProcedureNavSection = 
  | 'dashboard'
  | 'procedures'
  | 'categories'
  | 'checklists'
  | 'steps'
  | 'forms'
  | 'upload-form'
  | 'form-versions'
  | 'attach-forms'
  | 'legal-docs'
  | 'procedure-legal-links'
  | 'ai-knowledge'
  | 'audit-logs'
  | 'profile';

interface ProcedureManagerSidebarProps {
  currentSection: ProcedureNavSection;
  onSelectSection: (section: ProcedureNavSection) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  isCollapsedDesktop: boolean;
  onToggleCollapseDesktop: () => void;
  publishedCount?: number;
  draftCount?: number;
  activeFormsCount?: number;
}

export const ProcedureManagerSidebar: React.FC<ProcedureManagerSidebarProps> = ({
  currentSection,
  onSelectSection,
  isOpenMobile,
  onCloseMobile,
  isCollapsedDesktop,
  publishedCount = 45,
  draftCount = 6,
  activeFormsCount = 12
}) => {
  const { handleLogout, isLoggingOut } = useLogout();
  const handleNavClick = (section: ProcedureNavSection) => {
    onSelectSection(section);
    onCloseMobile();
  };

  const navGroups = [
    {
      title: 'Thủ tục hành chính',
      items: [
        {
          id: 'procedures' as ProcedureNavSection,
          label: 'Danh sách thủ tục',
          icon: Files,
          badge: `${publishedCount} CK · ${draftCount} nháp`,
          badgeColor: 'bg-emerald-100 text-emerald-800'
        },
        {
          id: 'categories' as ProcedureNavSection,
          label: 'Danh mục thủ tục',
          icon: FolderSimple,
          badge: '6 nhóm'
        },
        {
          id: 'checklists' as ProcedureNavSection,
          label: 'Thành phần hồ sơ',
          icon: ListChecks
        },
        {
          id: 'steps' as ProcedureNavSection,
          label: 'Quy trình thực hiện',
          icon: Path
        }
      ]
    },
    {
      title: 'Biểu mẫu',
      items: [
        {
          id: 'forms' as ProcedureNavSection,
          label: 'Danh sách biểu mẫu',
          icon: FileText,
          badge: `${activeFormsCount} mẫu`,
          badgeColor: 'bg-blue-100 text-blue-800'
        },
        {
          id: 'upload-form' as ProcedureNavSection,
          label: 'Upload biểu mẫu',
          icon: UploadSimple
        },
        {
          id: 'form-versions' as ProcedureNavSection,
          label: 'Phiên bản biểu mẫu',
          icon: ClockCounterClockwise
        },
        {
          id: 'attach-forms' as ProcedureNavSection,
          label: 'Gắn biểu mẫu vào thủ tục',
          icon: LinkSimple
        }
      ]
    },
    {
      title: 'Pháp lý & AI',
      items: [
        {
          id: 'legal-docs' as ProcedureNavSection,
          label: 'Văn bản pháp lý',
          icon: Scales,
          badge: '18 VB'
        },
        {
          id: 'procedure-legal-links' as ProcedureNavSection,
          label: 'Liên kết thủ tục - VB',
          icon: LinkBreak
        },
        {
          id: 'ai-knowledge' as ProcedureNavSection,
          label: 'Dữ liệu kiến thức AI',
          icon: Brain,
          badge: 'RAG Sync',
          badgeColor: 'bg-purple-100 text-purple-800'
        }
      ]
    }
  ];

  return (
    <>
      {isOpenMobile && <button type="button" className="admin-sidebar-overlay" onClick={onCloseMobile} aria-label="Đóng menu điều hướng" />}
      <aside id="procedure-manager-sidebar" className={`admin-sidebar ${isOpenMobile ? 'is-open' : ''} ${isCollapsedDesktop ? 'is-compact' : ''}`} aria-label="Điều hướng Quản lý Thủ tục">
        <div className="admin-brand">
          <BrandMark className="admin-brand-mark" size={42} />
          <div><BrandWordmark subtitle="Quản lý thủ tục" compact /></div>
          <button type="button" onClick={onCloseMobile} aria-label="Đóng menu"><X size={21} /></button>
        </div>
        <nav className="admin-nav">
          <div className="admin-nav-section">
            <p>Tổng quan</p>
            <button type="button" className={currentSection === 'dashboard' ? 'is-active' : ''} aria-current={currentSection === 'dashboard' ? 'page' : undefined} onClick={() => handleNavClick('dashboard')} title="Dashboard">
              <SquaresFour size={20} /><span>Dashboard</span>
            </button>
          </div>
          {navGroups.map(group => (
            <div className="admin-nav-section" key={group.title}>
              <p>{group.title}</p>
              {group.items.map(({ id, label, icon: Icon, badge }) => (
                <button key={id} type="button" className={currentSection === id ? 'is-active' : ''} aria-current={currentSection === id ? 'page' : undefined} onClick={() => handleNavClick(id)} title={badge ? `${label} · ${badge}` : label} aria-label={label}>
                  <Icon size={20} aria-hidden="true" /><span>{label}</span>{badge && <small>{id === 'procedures' ? publishedCount + draftCount : id === 'ai-knowledge' ? 'AI' : badge.split(' ')[0]}</small>}
                </button>
              ))}
            </div>
          ))}
          <div className="admin-nav-section">
            <p>Hệ thống</p>
            <button type="button" className={currentSection === 'audit-logs' ? 'is-active' : ''} onClick={() => handleNavClick('audit-logs')} title="Lịch sử cập nhật"><Article size={20} /><span>Lịch sử cập nhật</span></button>
            <button type="button" className={currentSection === 'profile' ? 'is-active' : ''} onClick={() => handleNavClick('profile')} title="Hồ sơ cá nhân"><UserGear size={20} /><span>Hồ sơ cá nhân</span></button>
            <button type="button" disabled={isLoggingOut} aria-busy={isLoggingOut} onClick={() => { if (window.confirm('Bạn có chắc chắn muốn đăng xuất khỏi cổng Quản lý Thủ tục?')) void handleLogout(); }} title="Đăng xuất" aria-label="Đăng xuất khỏi hệ thống"><SignOut size={20} /><span>Đăng xuất</span></button>
          </div>
        </nav>
        <div className="admin-sidebar-user"><span>HN</span><div><strong>Lê Hoàng Nam</strong><small>Chuyên viên Quản lý thủ tục</small></div></div>
      </aside>
    </>
  );
};
