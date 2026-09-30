import React, { useState } from 'react';
import { ManagerSidebar } from './ManagerSidebar';
import { ManagerHeader, managerSectionTitles } from './ManagerHeader';
import { ManagerDashboardView } from './views/ManagerDashboardView';
import { ManagerProfilesView } from './views/ManagerProfilesView';
import { ManagerSystemStatsView } from './views/ManagerSystemStatsView';
import { ManagerPerformanceView } from './views/ManagerPerformanceView';
import { ManagerFeedbackView } from './views/ManagerFeedbackView';
import { ManagerReportsView } from './views/ManagerReportsView';
import { ManagerPermissionsView } from './views/ManagerPermissionsView';
import { ManagerProfileView } from './views/ManagerProfileView';
import { ManagerProfileItem, ManagerSectionId } from './types';
import { initialManagerProfiles } from './mockData';
import { toast } from '@/components/ui/Toast';

export const ManagerPage: React.FC = () => {
  const [currentSection, setCurrentSection] = useState<ManagerSectionId>('dashboard');
  const [isOpenMobile, setIsOpenMobile] = useState(false);
  const [isCollapsedDesktop, setIsCollapsedDesktop] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Quản lý danh sách hồ sơ công dân
  const [profiles, setProfiles] = useState<ManagerProfileItem[]>(initialManagerProfiles);

  const handleSaveProfile = (profile: ManagerProfileItem) => {
    setProfiles((prev) => {
      const idx = prev.findIndex((p) => p.identityNumber === profile.identityNumber);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = profile;
        return next;
      }
      return [profile, ...prev];
    });
    toast.success(`Đã lưu hồ sơ công dân ${profile.fullName} thành công.`);
  };

  const handleExportQuickReport = () => {
    toast.success('Đang kết xuất báo cáo nhanh định kỳ (PDF)...');
  };

  const currentMeta = managerSectionTitles[currentSection] || {
    title: 'Quản lý Điều hành',
    subtitle: '',
  };

  return (
    <div className="admin-layout manager-layout">
      <a href="#manager-main" className="skip-link">
        Đến nội dung chính
      </a>

      {/* Sidebar điều hướng */}
      <ManagerSidebar
        currentSection={currentSection}
        onSelectSection={(sec) => setCurrentSection(sec)}
        isOpenMobile={isOpenMobile}
        onCloseMobile={() => setIsOpenMobile(false)}
        isCollapsedDesktop={isCollapsedDesktop}
        onToggleCollapseDesktop={() => setIsCollapsedDesktop(!isCollapsedDesktop)}
        profilesCount={profiles.length}
      />

      {/* Vùng nội dung chính */}
      <div className={`admin-workspace ${isCollapsedDesktop ? 'is-sidebar-collapsed' : ''}`}>
        <ManagerHeader
          currentSection={currentSection}
          onOpenMobileSidebar={() => setIsOpenMobile(true)}
          isCollapsedDesktop={isCollapsedDesktop}
          onToggleCollapseDesktop={() => setIsCollapsedDesktop(!isCollapsedDesktop)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onExportReport={handleExportQuickReport}
        />

        <main id="manager-main" className="admin-main" tabIndex={-1}>
          {/* Page Heading */}
          <div className="admin-page-heading mb-6">
            <div>
              <h1 className="text-xl font-bold text-slate-900">{currentMeta.title}</h1>
              {currentMeta.subtitle && (
                <p className="text-xs text-slate-500 mt-1">{currentMeta.subtitle}</p>
              )}
            </div>
          </div>

          {/* Dynamic Views */}
          {currentSection === 'dashboard' && (
            <ManagerDashboardView onNavigateSection={(sec) => setCurrentSection(sec)} />
          )}

          {currentSection === 'profiles' && (
            <ManagerProfilesView
              profiles={profiles}
              onSaveProfile={handleSaveProfile}
            />
          )}

          {(currentSection === 'stats-dossiers' ||
            currentSection === 'stats-procedures' ||
            currentSection === 'stats-searches' ||
            currentSection === 'stats-forms') && (
            <ManagerSystemStatsView section={currentSection} />
          )}

          {(currentSection === 'perf-processing-time' ||
            currentSection === 'perf-completion-rate' ||
            currentSection === 'perf-supplement-rate' ||
            currentSection === 'perf-officers') && (
            <ManagerPerformanceView section={currentSection} />
          )}

          {(currentSection === 'feedback-reports' ||
            currentSection === 'satisfaction-level') && (
            <ManagerFeedbackView section={currentSection} />
          )}

          {currentSection === 'reports' && <ManagerReportsView />}

          {currentSection === 'permissions' && <ManagerPermissionsView />}

          {currentSection === 'profile' && <ManagerProfileView />}
        </main>
      </div>
    </div>
  );
};
export default ManagerPage;
