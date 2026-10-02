import React, { useState, useEffect, useCallback } from 'react';
import { ManagerSidebar } from './ManagerSidebar';
import { ManagerHeader, managerSectionTitles } from './ManagerHeader';
import { ManagerProfilesView } from './views/ManagerProfilesView';
import { ManagerProfileDetailView } from './views/ManagerProfileDetailView';
import { ManagerSystemStatsView } from './views/ManagerSystemStatsView';
import { ManagerPerformanceView } from './views/ManagerPerformanceView';
import { ManagerFeedbackView } from './views/ManagerFeedbackView';
import { ManagerReportsView } from './views/ManagerReportsView';
import { ManagerPermissionsView } from './views/ManagerPermissionsView';
import { ManagerProfileView } from './views/ManagerProfileView';
import { ManagerProfileItem, ManagerSectionId } from './types';
import { toast } from '@/components/ui/Toast';
import {
  getAccounts,
  getAdminProfile,
  updateAdminProfile,
  deleteAdminProfile,
  authErrorMessage,
} from '@/lib/api';

export const ManagerPage: React.FC = () => {
  // Thay dashboard bằng trang thống kê hồ sơ làm mặc định
  const [currentSection, setCurrentSection] = useState<ManagerSectionId>('stats-dossiers');
  const [isOpenMobile, setIsOpenMobile] = useState(false);
  const [isCollapsedDesktop, setIsCollapsedDesktop] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Quản lý danh sách hồ sơ công dân & xem chi tiết từ API
  const [profiles, setProfiles] = useState<ManagerProfileItem[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<ManagerProfileItem | null>(null);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(false);
  const [profilesError, setProfilesError] = useState<string | null>(null);

  const fetchCitizenProfiles = useCallback(async () => {
    setIsLoadingProfiles(true);
    setProfilesError(null);
    try {
      // 1. Lấy danh sách account
      const accountPage = await getAccounts(1, 50);
      const accounts = accountPage.items || [];

      // 2. Fetch thông tin profile tương ứng của từng account
      const profileResults = await Promise.allSettled(
        accounts.map(async (acc) => {
          try {
            const p = await getAdminProfile(acc.id);
            const item: ManagerProfileItem = {
              userId: acc.id,
              username: acc.username,
              email: acc.email,
              isActive: acc.isActive,
              fullName: p.fullName || acc.username,
              identityNumber: p.identityNumber || '',
              phoneNumber: p.phoneNumber || '',
              dateOfBirth: p.dateOfBirth || '',
              gender: (p.gender === 'Nữ' || p.gender === 'Khác' ? p.gender : 'Nam'),
              permanentAddress: p.permanentAddress || '',
              temporaryAddress: p.temporaryAddress || '',
              dossierHistory: [
                {
                  code: 'HS-2026-0912',
                  procedureName: 'Đăng ký khai sinh',
                  field: 'Hộ tịch',
                  submittedAt: '28/09/2026',
                  status: 'Đã hoàn thành',
                  officer: 'Nguyễn Minh Anh',
                },
              ],
            };
            return item;
          } catch {
            // Trường hợp tài khoản chưa có profile hoặc chưa thiết lập đầy đủ
            const fallbackItem: ManagerProfileItem = {
              userId: acc.id,
              username: acc.username,
              email: acc.email,
              isActive: acc.isActive,
              fullName: acc.username,
              identityNumber: '',
              phoneNumber: '',
              dateOfBirth: '',
              gender: 'Nam',
              permanentAddress: '',
              temporaryAddress: '',
            };
            return fallbackItem;
          }
        })
      );

      const items: ManagerProfileItem[] = profileResults
        .filter((r): r is PromiseFulfilledResult<ManagerProfileItem> => r.status === 'fulfilled')
        .map((r) => r.value);

      setProfiles(items);
    } catch (err: unknown) {
      const msg = authErrorMessage(err);
      setProfilesError(msg);
      toast.error(`Không thể tải dữ liệu hồ sơ công dân: ${msg}`);
    } finally {
      setIsLoadingProfiles(false);
    }
  }, []);

  useEffect(() => {
    if (currentSection === 'profiles') {
      void fetchCitizenProfiles();
    }
  }, [currentSection, fetchCitizenProfiles]);

  const handleSaveProfile = async (profile: ManagerProfileItem) => {
    if (profile.userId) {
      try {
        const updated = await updateAdminProfile(profile.userId, {
          fullName: profile.fullName,
          identityNumber: profile.identityNumber || null,
          phoneNumber: profile.phoneNumber || null,
          dateOfBirth: (profile.dateOfBirth || null) as unknown as import('@/types/profile').ProfileInput['dateOfBirth'],
          gender: profile.gender || null,
          permanentAddress: profile.permanentAddress || null,
          temporaryAddress: profile.temporaryAddress || null,
        });

        const merged: ManagerProfileItem = {
          ...profile,
          fullName: updated.fullName,
          identityNumber: updated.identityNumber || '',
          phoneNumber: updated.phoneNumber || '',
          dateOfBirth: updated.dateOfBirth || '',
          gender: (updated.gender === 'Nữ' || updated.gender === 'Khác' ? updated.gender : 'Nam'),
          permanentAddress: updated.permanentAddress || '',
          temporaryAddress: updated.temporaryAddress || '',
        };

        setProfiles((prev) =>
          prev.map((p) => (p.userId === profile.userId ? merged : p))
        );

        if (selectedProfile && selectedProfile.userId === profile.userId) {
          setSelectedProfile(merged);
        }

        toast.success(`Đã cập nhật hồ sơ công dân ${merged.fullName} thành công.`);
      } catch (err: unknown) {
        const msg = authErrorMessage(err);
        toast.error(`Cập nhật hồ sơ thất bại: ${msg}`);
        throw err;
      }
    } else {
      // Trường hợp profile chưa gắn userId
      setProfiles((prev) => {
        const idx = prev.findIndex((p) => p.identityNumber === profile.identityNumber);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = profile;
          return next;
        }
        return [profile, ...prev];
      });

      if (selectedProfile && selectedProfile.identityNumber === profile.identityNumber) {
        setSelectedProfile(profile);
      }

      toast.success(`Đã lưu thông tin hồ sơ công dân ${profile.fullName}.`);
    }
  };

  const handleDeleteProfile = async (userId: string) => {
    try {
      await deleteAdminProfile(userId);
      setProfiles((prev) => prev.filter((p) => p.userId !== userId));
      if (selectedProfile && selectedProfile.userId === userId) {
        setSelectedProfile(null);
      }
      toast.success('Đã xóa hồ sơ công dân thành công.');
    } catch (err: unknown) {
      const msg = authErrorMessage(err);
      toast.error(`Xóa hồ sơ thất bại: ${msg}`);
      throw err;
    }
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
        onSelectSection={(sec) => {
          setCurrentSection(sec);
          setSelectedProfile(null);
        }}
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
          {/* Page Heading (Ẩn khi đang xem chi tiết công dân vì view chi tiết có header riêng) */}
          {!selectedProfile && (
            <div className="admin-page-heading mb-6">
              <div>
                <h1 className="text-xl font-bold text-slate-900">{currentMeta.title}</h1>
              </div>
            </div>
          )}

          {/* Dynamic Views */}
          {currentSection === 'profiles' && (
            selectedProfile ? (
              <ManagerProfileDetailView
                profile={selectedProfile}
                onBack={() => setSelectedProfile(null)}
                onEdit={(p) => {
                  setSelectedProfile(null);
                  toast.info(`Mở biểu mẫu chỉnh sửa thông tin của ${p.fullName}`);
                }}
              />
            ) : (
              <ManagerProfilesView
                profiles={profiles}
                isLoading={isLoadingProfiles}
                error={profilesError}
                onRefresh={fetchCitizenProfiles}
                onSaveProfile={handleSaveProfile}
                onDeleteProfile={handleDeleteProfile}
                onSelectProfile={(p) => setSelectedProfile(p)}
              />
            )
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
