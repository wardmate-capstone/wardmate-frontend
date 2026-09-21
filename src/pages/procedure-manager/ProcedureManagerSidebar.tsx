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
  ShieldCheck,
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
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="procedure-manager-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col border-r border-slate-200 bg-white transition-all duration-300 ease-in-out lg:static lg:z-auto ${
          isOpenMobile ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsedDesktop ? 'w-20' : 'w-72'}`}
        aria-label="Điều hướng Quản lý Thủ tục"
      >
        {/* Brand Header */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 px-4">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-red-800 to-red-950 text-white shadow-md">
              <ShieldCheck size={24} weight="duotone" className="text-gold-300" />
            </div>
            {!isCollapsedDesktop && (
              <div className="min-w-0">
                <span className="block truncate text-xs font-bold uppercase tracking-wider text-red-800">
                  WardMate Gov
                </span>
                <span className="block truncate text-sm font-extrabold text-slate-950">
                  Quản lý Thủ tục
                </span>
              </div>
            )}
          </div>
          {/* Mobile close button */}
          <button
            type="button"
            onClick={onCloseMobile}
            className="grid size-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 lg:hidden"
            aria-label="Đóng menu điều hướng"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Navigation */}
        <nav className="flex-1 space-y-6 overflow-y-auto p-3.5 focus:outline-none">
          {/* Dashboard Item */}
          <div>
            <button
              type="button"
              onClick={() => handleNavClick('dashboard')}
              className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors ${
                currentSection === 'dashboard'
                  ? 'bg-red-800 text-white shadow-sm'
                  : 'text-slate-700 hover:bg-red-50 hover:text-red-900'
              }`}
              title="Tổng quan hệ thống"
            >
              <SquaresFour size={22} weight={currentSection === 'dashboard' ? 'fill' : 'regular'} className="shrink-0" />
              {!isCollapsedDesktop && (
                <span className="flex-1 text-left">Dashboard</span>
              )}
            </button>
          </div>

          {/* Grouped navigation */}
          {navGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              {!isCollapsedDesktop && (
                <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {group.title}
                </p>
              )}
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentSection === item.id;
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => handleNavClick(item.id)}
                        className={`group flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-red-800 font-semibold text-white shadow-sm'
                            : 'text-slate-700 hover:bg-red-50 hover:text-red-900'
                        }`}
                        title={item.label}
                      >
                        <Icon
                          size={20}
                          weight={isActive ? 'fill' : 'regular'}
                          className={`shrink-0 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-red-800'}`}
                        />
                        {!isCollapsedDesktop && (
                          <>
                            <span className="flex-1 truncate text-left">{item.label}</span>
                            {item.badge && (
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                  isActive
                                    ? 'bg-white/20 text-white'
                                    : item.badgeColor || 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {item.badge}
                              </span>
                            )}
                          </>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          {/* System & Audit */}
          <div className="space-y-1 border-t border-slate-100 pt-3">
            {!isCollapsedDesktop && (
              <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Hệ thống
              </p>
            )}
            <ul className="space-y-1">
              <li>
                <button
                  type="button"
                  onClick={() => handleNavClick('audit-logs')}
                  className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
                    currentSection === 'audit-logs'
                      ? 'bg-red-800 font-semibold text-white shadow-sm'
                      : 'text-slate-700 hover:bg-red-50 hover:text-red-900'
                  }`}
                  title="Lịch sử cập nhật"
                >
                  <Article size={20} weight={currentSection === 'audit-logs' ? 'fill' : 'regular'} className="shrink-0" />
                  {!isCollapsedDesktop && <span className="flex-1 text-left">Lịch sử cập nhật</span>}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNavClick('profile')}
                  className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
                    currentSection === 'profile'
                      ? 'bg-red-800 font-semibold text-white shadow-sm'
                      : 'text-slate-700 hover:bg-red-50 hover:text-red-900'
                  }`}
                  title="Hồ sơ cá nhân"
                >
                  <UserGear size={20} weight={currentSection === 'profile' ? 'fill' : 'regular'} className="shrink-0" />
                  {!isCollapsedDesktop && <span className="flex-1 text-left">Hồ sơ cá nhân</span>}
                </button>
              </li>
            </ul>
          </div>
        </nav>

        {/* User Card & Logout Footer */}
        <div className="shrink-0 border-t border-slate-200 bg-slate-50 p-3">
          <div className="flex items-center justify-between gap-2">
            {!isCollapsedDesktop && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-slate-900">Lê Hoàng Nam</p>
                <p className="truncate text-[11px] text-slate-500">Chuyên viên Quản lý thủ tục</p>
              </div>
            )}
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Bạn có chắc chắn muốn đăng xuất khỏi cổng Quản lý Thủ tục?')) {
                  window.location.href = '/dang-nhap';
                }
              }}
              className="grid size-9 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-red-100 hover:text-red-800"
              title="Đăng xuất"
              aria-label="Đăng xuất khỏi hệ thống"
            >
              <SignOut size={20} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
