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
import { UnifiedSelfProfileView } from '@/components/profile/UnifiedSelfProfileView';
import { ManagerProfileItem, ManagerSectionId } from './types';
import { toast } from '@/components/ui/Toast';
import {
  getUserProfiles,
  getAdminProfile,
  updateAdminProfile,
  updateAccountStatus,
  authErrorMessage,
} from '@/lib/api';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAuthStore } from '@/stores/authStore';
import { getGreeting } from '@/lib/utils';

export const ManagerPage: React.FC = () => {
  // Thay dashboard bằng trang thống kê hồ sơ làm mặc định
  const [currentSection, setCurrentSection] = useState<ManagerSectionId>('stats-dossiers');
  const [isOpenMobile, setIsOpenMobile] = useState(false);
  const [isCollapsedDesktop, setIsCollapsedDesktop] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { profile } = useUserProfile();
  const user = useAuthStore((s) => s.user);
  const managerName = profile?.fullName?.trim() || user?.username || 'Lãnh đạo';

  // Quản lý danh sách hồ sơ công dân & xem chi tiết từ API 60
  const [profiles, setProfiles] = useState<ManagerProfileItem[]>([]);
  const [profilesPage, setProfilesPage] = useState(1);
  const [profilesTotal, setProfilesTotal] = useState(0);
  const [selectedProfile, setSelectedProfile] = useState<ManagerProfileItem | null>(null);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(false);
  const [profilesError, setProfilesError] = useState<string | null>(null);

  const fetchProfiles = useCallback(async (page: number) => {
    setIsLoadingProfiles(true);
    setProfilesError(null);
    try {
      const data = await getUserProfiles(page, 20);
      setProfilesTotal(data.total);
      const items: ManagerProfileItem[] = data.items.map((p) => ({
        userId: p.userId,
        fullName: p.fullName,
        identityNumber: p.identityNumber || '',
        phoneNumber: p.phoneNumber || '',
        dateOfBirth: p.dateOfBirth || '',
        gender: (p.gender === 'Nữ' || p.gender === 'Khác' ? p.gender : 'Nam'),
        permanentAddress: p.permanentAddress || '',
        temporaryAddress: p.temporaryAddress || '',
        updatedAt: p.updatedAt,
      }));
      setProfiles(items);
    } catch (err: unknown) {
      const msg = authErrorMessage(err);
      setProfilesError(msg);
      toast.error(`Không thể tải dữ liệu hồ sơ: ${msg}`);
    } finally {
      setIsLoadingProfiles(false);
    }
  }, []);

  useEffect(() => {
    if (currentSection === 'profiles') {
      void fetchProfiles(profilesPage);
    }
  }, [currentSection, profilesPage, fetchProfiles]);

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

  const handleToggleAccountStatus = async (item: ManagerProfileItem) => {
    const newStatus = !(item.isActive ?? true);
    try {
      await updateAccountStatus(item.userId, newStatus);
      setProfiles((prev) =>
        prev.map((p) => (p.userId === item.userId ? { ...p, isActive: newStatus } : p))
      );
      toast.success(
        newStatus
          ? `Đã kích hoạt tài khoản cán bộ ${item.fullName}.`
          : `Đã tạm khóa tài khoản cán bộ ${item.fullName}.`
      );
    } catch (err: unknown) {
      toast.error(authErrorMessage(err));
    }
  };

  const handleSelectProfile = async (item: ManagerProfileItem) => {
    setSelectedProfile(item);
    if (item.userId) {
      try {
        const fresh = await getAdminProfile(item.userId);
        setSelectedProfile((prev) =>
          prev && prev.userId === item.userId
            ? {
                ...prev,
                fullName: fresh.fullName,
                identityNumber: fresh.identityNumber || '',
                phoneNumber: fresh.phoneNumber || '',
                dateOfBirth: fresh.dateOfBirth || '',
                gender: (fresh.gender === 'Nữ' || fresh.gender === 'Khác' ? fresh.gender : 'Nam'),
                permanentAddress: fresh.permanentAddress || '',
                temporaryAddress: fresh.temporaryAddress || '',
              }
            : prev
        );
      } catch {
        // Giữ thông tin đã có từ danh sách
      }
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
          {/* Page Heading (Ẩn khi đang xem chi tiết công dân hoặc xem hồ sơ cá nhân vì view chi tiết có header riêng) */}
          {!selectedProfile && currentSection !== 'profile' && (
            <div className="admin-page-heading mb-6">
              <div>
                <h1 className="text-xl font-bold text-slate-900">{currentMeta.title}</h1>
                {currentSection === 'stats-dossiers' && (
                  <p className="mt-1 text-sm font-medium text-slate-600 sm:text-base">
                    {getGreeting()}, Lãnh đạo {managerName}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Dynamic Views */}
          {currentSection === 'profiles' && (
            selectedProfile ? (
              <ManagerProfileDetailView
                profile={selectedProfile}
                isFrontDesk={true}
                backLabel="Quay lại danh sách cán bộ Một cửa"
                onBack={() => setSelectedProfile(null)}
                onEdit={(p) => {
                  setSelectedProfile(null);
                  toast.info(`Mở biểu mẫu chỉnh sửa thông tin của ${p.fullName}`);
                }}
              />
            ) : (
              <ManagerProfilesView
                profiles={profiles}
                total={profilesTotal}
                page={profilesPage}
                pageSize={20}
                isLoading={isLoadingProfiles}
                error={profilesError}
                onRefresh={() => void fetchProfiles(profilesPage)}
                onPageChange={(p) => setProfilesPage(p)}
                onSaveProfile={handleSaveProfile}
                onToggleStatus={handleToggleAccountStatus}
                onSelectProfile={handleSelectProfile}
                onFrontDeskCreated={() => void fetchProfiles(profilesPage)}
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

          {currentSection === 'profile' && <UnifiedSelfProfileView />}
        </main>
      </div>
    </div>
  );
};
export default ManagerPage;
