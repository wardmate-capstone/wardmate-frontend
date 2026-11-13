import { UserDropdown } from '@/components/layout/UserDropdown';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { WorkspaceSidebar, type WorkspaceNavGroup } from '@/components/layout/WorkspaceSidebar';
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useUserProfile } from "@/hooks/useUserProfile";
import { getGreeting } from "@/lib/utils";
import {
  ArrowsClockwise,
  Books,
  Broadcast,
  Buildings,
  CaretDown,
  ClipboardText,
  Database,
  House,
  Key,
  List,
  MagnifyingGlass,
  Plus,
  ClockCounterClockwise,
  ShieldCheck,
  SidebarSimple,
  Stack,
  UserCircle,
  Users,
} from "@phosphor-icons/react";
import { toast } from "@/components/ui/Toast";
import { Modal, Skeleton, TableSkeletonRows } from "@/components/ui";
import {
  getAdminUsers,
  getAccount,
  getAccounts,
  getAdminProfile,
  updateAccountStatus,
  getWards,
  createWard,
  assignUserWard,
  saveAdminProfile,
  authErrorMessage,
  type AccountItem,
  type AccountPage,
  type ManagedUserDto,
  type ManagedUserPage,
  type WardDto,
  type UserProfileDto,
} from "@/lib/api";
import { ManagerProfileDetailView } from '@/pages/manager/views/ManagerProfileDetailView';
import { UnifiedSelfProfileView } from '@/components/profile/UnifiedSelfProfileView';
import type { ManagerProfileItem } from '@/pages/manager/types';
import { actionLabels, roleLabels, AdminRolesView, UserRolesModal } from './AdminRbacViews';
import { AdminAuditView, type AdminAuditTab } from './AdminAuditView';
import { SystemSettingsView } from './SystemSettingsView';
import { ServiceHealthView } from './ServiceHealthView';
import { SystemBackupsView } from './SystemBackupsView';
import { rbacApi, rbacError, type AuditLog } from '@/lib/api/rbac';
import { AdminProceduresView } from './AdminProceduresView';
import { usePublicProcedureList } from '@/hooks/useProcedureCategories';
import { KnowledgeBaseView } from '@/components/ai/KnowledgeBaseView';
import { AnalyticsJobsView } from './AnalyticsJobsView';
import { NotificationDeliveriesView } from './NotificationDeliveriesView';
import { CalendarClosuresView } from '@/components/staffing/CalendarClosuresView';
import { CreateStaffAccountModal } from './CreateStaffAccountModal';

type SectionId =
  | "system-settings"
  | "closures"
  | "analytics-jobs"
  | "overview"
  | "procedures"
  | "knowledge"
  | "accounts"
  | "users"
  | "wards"
  | "roles"
  | "integrations"
  | "audit"
  | "backup"
  | "notification-deliveries"
  | "profile";

const navigation: WorkspaceNavGroup<SectionId>[] = [
  {
    title: "Tổng quan",
    items: [{ id: "overview", label: "Tổng quan", icon: House, fallbackRoles: ['IT_ADMIN'] }],
  },
  {
    title: "Nội dung nghiệp vụ",
    items: [
      {
        id: "procedures",
        label: "Danh sách thủ tục",
        icon: ClipboardText,
        permissions: ['procedure.read', 'procedure.create', 'procedure.update', 'procedure.publish', 'procedure.status'],
        fallbackRoles: ['IT_ADMIN'],
      },
      {
        id: "knowledge",
        label: "Dữ liệu kiến thức AI",
        icon: Books,
        permissions: ['knowledge.manage'],
      },
    ],
  },
  {
    title: "Tài khoản & truy cập",
    items: [
      { id: "accounts", label: "Tài khoản đăng nhập", icon: Key, permissions: ['iam.accounts.'] },
      { id: "users", label: "Người dùng hệ thống", icon: Users, permissions: ['iam.accounts.'] },
      { id: "wards", label: "Đơn vị Phường / Xã", icon: Buildings, permissions: ['iam.wards.'] },
      { id: "roles", label: "Vai trò & quyền hạn", icon: ShieldCheck, permissions: ['iam.rbac.manage'] },
    ],
  },
  {
    title: "Vận hành hệ thống",
    items: [
      { id: "analytics-jobs", label: "Cập nhật thống kê", icon: ArrowsClockwise, fallbackRoles: ['IT_ADMIN'] },
      { id: "notification-deliveries", label: "Phát thông báo", icon: Broadcast, permissions: ['notifications.deliveries.read'], fallbackRoles: ['IT_ADMIN'] },
      { id: "closures", label: "Lịch ngày lễ toàn quốc", icon: ClockCounterClockwise, permissions: ['workflow.calendar.manage'] },
      { id: "integrations", label: "Giám sát dịch vụ", icon: Stack, fallbackRoles: ['IT_ADMIN'] },
      { id: "system-settings", label: "Cấu hình hệ thống", icon: Stack, fallbackRoles: ['IT_ADMIN'] },
      { id: "audit", label: "Nhật ký hoạt động", icon: ClockCounterClockwise, fallbackRoles: ['IT_ADMIN'] },
      { id: "backup", label: "Sao lưu dữ liệu", icon: Database, fallbackRoles: ['IT_ADMIN'] },
      { id: "profile", label: "Hồ sơ cá nhân", icon: UserCircle, permissions: ['iam.profile.read', 'iam.profile.write'] },
    ],
  },
];





const sectionMeta: Record<SectionId, { title: string }> = {
  'system-settings': { title: 'Cấu hình hệ thống' },
  closures: { title: 'Lịch ngày lễ toàn quốc' },
  'analytics-jobs': { title: 'Cập nhật số liệu thống kê' },
  'notification-deliveries': { title: 'Quản trị phát thông báo' },
  overview: { title: "Tổng quan" },
  procedures: { title: "Danh sách thủ tục" },
  knowledge: { title: "Dữ liệu kiến thức AI" },
  accounts: { title: "Tài khoản đăng nhập" },
  users: { title: "Người dùng hệ thống" },
  wards: { title: "Quản lý đơn vị Phường / Xã" },
  roles: { title: "Vai trò & quyền hạn" },
  integrations: { title: "Giám sát dịch vụ" },
  audit: { title: "Nhật ký hoạt động" },
  backup: { title: "Sao lưu dữ liệu" },
  profile: { title: "Hồ sơ cá nhân" },
};

export function AdminPage({ embedded = false, initialSection = "overview" }: { embedded?: boolean; initialSection?: SectionId } = {}) {
  const [activeSection, setActiveSection] = useState<SectionId>(initialSection);
  const [auditTab, setAuditTab] = useState<AdminAuditTab>('events');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [query, setQuery] = useState("");
  const meta = sectionMeta[activeSection];
  const { profile } = useUserProfile();
  const user = useAuthStore((s) => s.user);
  const adminName = profile?.fullName?.trim() || user?.username || 'Quản trị viên';

  // --- Người dùng hệ thống (API 54: Users & API 56-58: Wards) ---
  const [userData, setUserData] = useState<ManagedUserPage | null>(null);
  const [userPage, setUserPage] = useState(1);
  const [userLoading, setUserLoading] = useState(false);
  const [userError, setUserError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [wards, setWards] = useState<WardDto[]>([]);
  const wardsRef = useRef<WardDto[]>([]);
  // Lọc vai trò phía server (`role` của /admin/users); trạng thái BE chưa hỗ trợ nên lọc trong trang.
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [createStaffOpen, setCreateStaffOpen] = useState(false);
  const canManageAccounts = Boolean(user?.permissions.includes('iam.accounts.manage'));
  const canCreateStaff = canManageAccounts && Boolean(user?.roles.includes('IT_ADMIN'));

  const fetchUsers = useCallback(async (page: number) => {
    setUserLoading(true);
    setUserError(null);
    try {
      // Tên phường lấy từ danh sách đang có; fetchWards (chạy song song) sẽ bổ sung khi tải xong.
      const activeWards = wardsRef.current;
      const data = await getAdminUsers({
        page,
        pageSize: 20,
        // Cho phép gõ @username: bỏ ký tự @ ở đầu trước khi tìm
        search: query.trim().replace(/^@+/, '') || undefined,
        role: roleFilter === 'ALL' ? undefined : roleFilter,
      });

      setUserData({
        ...data,
        items: data.items.map((item) => {
          const matchedWard = item.wardCode
            ? activeWards.find((w) => w.code.trim().toUpperCase() === item.wardCode?.trim().toUpperCase())
            : null;
          return {
            id: item.id,
            username: item.username,
            email: item.email,
            isActive: item.isActive,
            wardCode: item.wardCode,
            wardId: matchedWard?.id ?? null,
            wardName: matchedWard?.name ?? item.wardCode ?? null,
            profile: item.fullName ? {
              fullName: item.fullName,
              identityNumber: item.identityNumber ?? null,
            } : null,
            roles: item.roles.map((roleName, index) => ({ id: index + 1, roleName })),
          };
        }),
      });
    } catch (err) {
      setUserError(authErrorMessage(err));
    } finally {
      setUserLoading(false);
    }
  }, [query, roleFilter]);

  const [wardsLoading, setWardsLoading] = useState(false);
  const fetchWards = useCallback(async () => {
    setWardsLoading(true);
    try {
      const data = await getWards();
      wardsRef.current = data;
      setWards(data);
      setUserData((current) => current && ({
        ...current,
        items: current.items.map((item) => {
          const matched = item.wardCode
            ? data.find((ward) => ward.code.trim().toUpperCase() === item.wardCode?.trim().toUpperCase())
            : null;
          return {
            ...item,
            wardId: matched?.id ?? item.wardId ?? null,
            wardName: matched?.name ?? item.wardName ?? item.wardCode ?? null,
          };
        }),
      }));
      return data;
    } catch (err) {
      toast.error(`Không tải được danh sách phường / xã: ${authErrorMessage(err)}`);
      return [];
    } finally {
      setWardsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeSection === 'users') {
      // Debounce theo ô tìm kiếm; danh sách phường chỉ cần để hiển thị tên và chọn phường.
      const timer = window.setTimeout(() => void fetchUsers(userPage), 300);
      return () => window.clearTimeout(timer);
    }
  }, [activeSection, userPage, fetchUsers]);
  useEffect(() => {
    if (activeSection === 'users' || activeSection === 'wards') void fetchWards();
  }, [activeSection, fetchWards]);

    const currentUserId = useAuthStore((s) => s.user?.id);

  const filteredUsers = useMemo(() => {
    if (!userData) return [];
    return userData.items.filter((item) => {
      // Ẩn tài khoản quản trị viên / IT_ADMIN khỏi danh sách người dùng thông thường
      if (item.id === currentUserId) return false;
      if (item.username.toLowerCase() === 'admin' || item.username.toLowerCase().startsWith('admin.')) return false;
      if (item.roles?.some((r) => r.roleName === 'IT_ADMIN')) return false;
      return true;
    });
  }, [userData, currentUserId]);

  // ACCOUNTS MANAGEMENT STATE (/api/v1/accounts)
  const [accountsData, setAccountsData] = useState<AccountPage | null>(null);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [accountsError, setAccountsError] = useState<string | null>(null);
  const [accountsPage, setAccountsPage] = useState(1);
  const [accountToToggleDirect, setAccountToToggleDirect] = useState<AccountItem | null>(null);

  const fetchAccounts = useCallback(async (page: number) => {
    setAccountsLoading(true);
    setAccountsError(null);
    try {
      const data = await getAccounts(page, 20);
      setAccountsData(data);
    } catch (err) {
      setAccountsError(authErrorMessage(err));
    } finally {
      setAccountsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeSection === 'accounts') {
      void fetchAccounts(accountsPage);
      void fetchWards();
    }
  }, [activeSection, accountsPage, fetchAccounts, fetchWards]);

  const filteredAccounts = useMemo(() => {
    if (!accountsData) return [];
    return accountsData.items.filter((item) => {
      // Ẩn tài khoản quản trị viên / IT_ADMIN khỏi danh sách tài khoản
      if (item.id === currentUserId) return false;
      if (item.username.toLowerCase() === 'admin' || item.username.toLowerCase().startsWith('admin.')) return false;
      return true;
    });
  }, [accountsData, currentUserId]);

  async function confirmToggleDirectAccountStatus() {
    if (!accountToToggleDirect || togglingId) return;
    const account = accountToToggleDirect;
    setTogglingId(account.id);
    const newStatus = !account.isActive;
    try {
      await updateAccountStatus(account.id, newStatus);
      setAccountsData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items.map((item) =>
            item.id === account.id ? { ...item, isActive: newStatus } : item
          ),
        };
      });
      setUserData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items.map((item) =>
            item.id === account.id ? { ...item, isActive: newStatus } : item
          ),
        };
      });
      toast.success(
        newStatus
          ? `Đã kích hoạt tài khoản ${account.username}.`
          : `Đã tạm khóa tài khoản ${account.username}.`
      );
      setAccountToToggleDirect(null);
    } catch (err) {
      toast.error(authErrorMessage(err));
    } finally {
      setTogglingId(null);
    }
  }

  const [accountToToggle, setAccountToToggle] = useState<ManagedUserDto | null>(null);

  async function confirmToggleAccountStatus() {
    if (!accountToToggle || togglingId) return;
    const account = accountToToggle;
    setTogglingId(account.id);
    const newStatus = !account.isActive;
    try {
      await updateAccountStatus(account.id, newStatus);
      setUserData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items.map((item) =>
            item.id === account.id ? { ...item, isActive: newStatus } : item
          ),
        };
      });
      toast.success(
        newStatus
          ? `Đã kích hoạt tài khoản ${account.username}.`
          : `Đã tạm khóa tài khoản ${account.username}.`
      );
      setAccountToToggle(null);
    } catch (err) {
      toast.error(authErrorMessage(err));
    } finally {
      setTogglingId(null);
    }
  }

  async function handleAssignWard(userId: string, wardId: string | null) {
    try {
      await assignUserWard(userId, wardId);
      const chosenWard = wards.find((w) => w.id === wardId);
      setUserData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items.map((u) =>
            u.id === userId
              ? {
                  ...u,
                  wardId,
                  wardCode: chosenWard ? chosenWard.code : null,
                  wardName: chosenWard ? chosenWard.name : null,
                }
              : u
          ),
        };
      });
      toast.success('Đã cập nhật phường công tác thành công.');
    } catch (err) {
      toast.error(authErrorMessage(err));
    }
  }


  const [selectedUser, setSelectedUser] = useState<ManagedUserDto | null>(null);
  const [roleUser, setRoleUser] = useState<ManagedUserDto>();
  const [detailProfile, setDetailProfile] = useState<UserProfileDto | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  async function handleOpenUserDetail(user: ManagedUserDto) {
    setSelectedUser(user);
    setDetailProfile(user.profile ?? null);
    setDetailLoading(true);
    try {
      const freshProfile = await getAdminProfile(user.id);
      setDetailProfile(freshProfile);
    } catch {
      if (!user.profile) {
        setDetailProfile(null);
      }
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleSaveUserProfile(item: ManagerProfileItem) {
    if (!selectedUser) return;
    const keep = (value?: string | null) => value?.trim() || null;
    try {
      const updated = await saveAdminProfile(selectedUser.id, {
        fullName: item.fullName,
        identityNumber: keep(item.identityNumber),
        phoneNumber: keep(item.phoneNumber),
        dateOfBirth: (item.dateOfBirth || null) as unknown as import('@/types/profile').ProfileInput['dateOfBirth'],
        gender: item.gender || null,
        permanentAddress: keep(item.permanentAddress),
        temporaryAddress: keep(item.temporaryAddress),
      });
      setDetailProfile(updated);
      setUserData((prev) => prev && ({
        ...prev,
        items: prev.items.map((u) => (u.id === selectedUser.id ? { ...u, profile: { ...u.profile, ...updated } } : u)),
      }));
      toast.success(`Đã cập nhật hồ sơ của ${updated.fullName}.`);
    } catch (err) {
      toast.error(`Cập nhật hồ sơ thất bại: ${authErrorMessage(err)}`);
      throw err;
    }
  }

  function selectSection(id: SectionId) {
    setActiveSection(id);
    setSelectedUser(null);
    setDetailProfile(null);
    setQuery("");
    setSidebarOpen(false);
  }


  return (
    <div className={embedded ? "" : "admin-layout"}>
      {!embedded && <a href="#admin-main" className="skip-link">
        Đến nội dung chính
      </a>}
      {!embedded && <WorkspaceSidebar workspace="admin" subtitle="Quản trị hệ thống" activeSection={activeSection} groups={navigation} onSelectSection={selectSection} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} isCompact={sidebarCollapsed} />}

      <div
        className={embedded ? "" : `admin-workspace ${sidebarCollapsed ? "is-sidebar-collapsed" : ""}`}
      >
        {!embedded && <header className="admin-topbar">
          <button
            type="button"
            className="admin-menu-toggle"
            aria-label="Mở menu quản trị"
            aria-expanded={sidebarOpen}
            onClick={() => setSidebarOpen(true)}
          >
            <List size={23} />
          </button>
          <button
            type="button"
            className={`admin-collapse-button ${sidebarCollapsed ? "is-collapsed" : ""}`}
            aria-label={
              sidebarCollapsed
                ? "Mở rộng thanh điều hướng"
                : "Thu gọn thanh điều hướng"
            }
            aria-controls="admin-sidebar"
            aria-expanded={!sidebarCollapsed}
            onClick={() => setSidebarCollapsed((current) => !current)}
          >
            <SidebarSimple size={21} />
          </button>
          <div className="admin-topbar-actions">
            <NotificationBell />
            <UserDropdown />
          </div>
        </header>}

        <main id={embedded ? undefined : "admin-main"} className={embedded ? "space-y-5" : "admin-main"} tabIndex={-1}>
          {!(activeSection === "users" && selectedUser) && activeSection !== "profile" && activeSection !== "procedures" && (
            <div className="admin-page-heading mb-6">
              <div>
                <h1>{meta.title}</h1>
                {activeSection === "overview" && (
                  <p className="mt-1 text-sm font-medium text-slate-600 sm:text-base">
                    {getGreeting()}, Quản trị viên {adminName}
                  </p>
                )}
              </div>
            </div>
          )}

          {activeSection === "overview" && (
            <Overview onSelect={id => { if (id === 'audit') setAuditTab('iam'); selectSection(id); }} wardsCount={wards.length} />
          )}
          {activeSection === "procedures" && (
            <AdminProceduresView />
          )}
          {activeSection === "analytics-jobs" && <AnalyticsJobsView />}
          {activeSection === "notification-deliveries" && <NotificationDeliveriesView key={user?.id} />}
          {activeSection === "closures" && <CalendarClosuresView />}
          {activeSection === "knowledge" && (
            <KnowledgeBaseView />
          )}
          {activeSection === "profile" && <UnifiedSelfProfileView />}
          {activeSection === "accounts" && (
            <AccountsView
              query={query}
              setQuery={setQuery}
              accounts={filteredAccounts}
              wards={wards}
              total={accountsData?.total ?? 0}
              page={accountsPage}
              pageSize={20}
              loading={accountsLoading}
              error={accountsError}
              togglingId={togglingId}
              onPageChange={(p) => setAccountsPage(p)}
              onRetry={() => void fetchAccounts(accountsPage)}
              onToggleStatus={(acc) => setAccountToToggleDirect(acc)}
              onCreateStaff={canCreateStaff ? () => setCreateStaffOpen(true) : undefined}
            />
          )}
          {activeSection === "users" && (
            selectedUser ? (
              detailLoading ? (
                <div className="space-y-6" role="status" aria-label="Đang tải thông tin chi tiết người dùng">
                  <div className="admin-card p-6 border-l-4 border-l-red-800 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Skeleton className="size-16 rounded-2xl" />
                      <div className="space-y-2">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="admin-card p-6 space-y-4">
                      <Skeleton className="h-5 w-40" />
                      <Skeleton className="h-10 w-full rounded-xl" />
                      <Skeleton className="h-10 w-full rounded-xl" />
                    </div>
                    <div className="admin-card p-6 space-y-4">
                      <Skeleton className="h-5 w-40" />
                      <Skeleton className="h-10 w-full rounded-xl" />
                      <Skeleton className="h-10 w-full rounded-xl" />
                    </div>
                  </div>
                </div>
              ) : (
                <ManagerProfileDetailView
                  profile={({
                    userId: selectedUser.id,
                    username: selectedUser.username,
                    email: selectedUser.email,
                    isActive: selectedUser.isActive,
                    fullName: detailProfile?.fullName || selectedUser.profile?.fullName || selectedUser.username,
                    identityNumber: detailProfile?.identityNumber || selectedUser.profile?.identityNumber || '',
                    phoneNumber: detailProfile?.phoneNumber || selectedUser.profile?.phoneNumber || '',
                    dateOfBirth: detailProfile?.dateOfBirth || selectedUser.profile?.dateOfBirth || '',
                    gender: (['Nam', 'Nữ', 'Khác'].includes(detailProfile?.gender || selectedUser.profile?.gender || '')
                      ? (detailProfile?.gender || selectedUser.profile?.gender)
                      : '') as '' | 'Nam' | 'Nữ' | 'Khác',
                    permanentAddress: detailProfile?.permanentAddress || selectedUser.profile?.permanentAddress || '',
                    temporaryAddress: detailProfile?.temporaryAddress || selectedUser.profile?.temporaryAddress || '',
                  }) as ManagerProfileItem}
                  isFrontDesk={false}
                  onSave={canManageAccounts ? handleSaveUserProfile : undefined}
                  backLabel="Quay lại danh sách người dùng"
                  onBack={() => {
                    setSelectedUser(null);
                    setDetailProfile(null);
                  }}
                  accountInfo={{
                    username: selectedUser.username,
                    email: selectedUser.email,
                    wardName: selectedUser.wardName,
                    roles: selectedUser.roles,
                    isActive: selectedUser.isActive,
                  }}
                />
              )
            ) : (
              <UsersView
                query={query}
                setQuery={setQuery}
                users={filteredUsers}
                wards={wards}
                total={userData?.total ?? 0}
                page={userPage}
                pageSize={20}
                loading={userLoading}
                error={userError}
                togglingId={togglingId}
                onPageChange={(p) => setUserPage(p)}
                onRetry={() => void fetchUsers(userPage)}
                onToggleStatus={(u) => setAccountToToggle(u)}
                onAssignWard={handleAssignWard}
                onSelectUser={handleOpenUserDetail}
                onManageRoles={setRoleUser}
                roleFilter={roleFilter}
                onRoleFilterChange={(value) => { setRoleFilter(value); setUserPage(1); }}
                onCreateStaff={canCreateStaff ? () => setCreateStaffOpen(true) : undefined}
              />
            )
          )}
          {activeSection === "wards" && (
            <WardsView
              wards={wards}
              loading={wardsLoading}
              onRetry={() => void fetchWards()}
              onWardCreated={() => void fetchWards()}
            />
          )}
          {activeSection === "roles" && <AdminRolesView />}
          {activeSection === "integrations" && (
            user?.roles.includes('IT_ADMIN') ? <ServiceHealthView key={user.id} /> : <p role="alert">Bạn không có quyền giám sát dịch vụ.</p>
          )}
          {activeSection === "audit" && <AdminAuditView key={user?.id} tab={auditTab} onTab={setAuditTab} />}
          {activeSection === "system-settings" && user?.roles.includes('IT_ADMIN') && <SystemSettingsView key={user.id} onHistory={() => { setAuditTab('settings'); selectSection('audit'); }} />}
          {activeSection === "backup" && (user?.roles.includes('IT_ADMIN') ? <SystemBackupsView key={user.id} /> : <p role="alert">Bạn không có quyền quản lý sao lưu.</p>)}
        </main>
      </div>
      {canCreateStaff && (
        <CreateStaffAccountModal
          open={createStaffOpen}
          wards={wards}
          onOpenChange={setCreateStaffOpen}
          onCreated={() => { void fetchUsers(userPage); void fetchAccounts(accountsPage); }}
        />
      )}
      <UserRolesModal user={roleUser} onClose={() => setRoleUser(undefined)} onChanged={() => void fetchUsers(userPage)} />

      {/* Modal xác nhận Khóa / Mở khóa tài khoản trực tiếp */}
      {accountToToggleDirect && (
        <Modal
          open={Boolean(accountToToggleDirect)}
          onOpenChange={(open) => {
            if (!open) setAccountToToggleDirect(null);
          }}
          title={accountToToggleDirect.isActive ? "Xác nhận tạm khóa tài khoản" : "Xác nhận kích hoạt tài khoản"}
        >
          <div className="space-y-4 py-2">
            <p className="text-xs sm:text-sm text-slate-600">
              {accountToToggleDirect.isActive ? (
                <>
                  Bạn có chắc chắn muốn <strong>tạm khóa</strong> tài khoản{" "}
                  <strong className="text-slate-900">@{accountToToggleDirect.username}</strong>? Người dùng sẽ không thể đăng nhập vào hệ thống khi tài khoản bị khóa.
                </>
              ) : (
                <>
                  Bạn có chắc chắn muốn <strong>kích hoạt lại</strong> tài khoản{" "}
                  <strong className="text-slate-900">@{accountToToggleDirect.username}</strong>?
                </>
              )}
            </p>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setAccountToToggleDirect(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={Boolean(togglingId)}
                onClick={() => void confirmToggleDirectAccountStatus()}
                className={`px-4 py-2 text-xs font-bold rounded-lg text-white transition-colors disabled:opacity-50 ${
                  accountToToggleDirect.isActive
                    ? "bg-amber-700 hover:bg-amber-800"
                    : "bg-emerald-700 hover:bg-emerald-800"
                }`}
              >
                {togglingId ? "Đang xử lý..." : accountToToggleDirect.isActive ? "Tạm khóa tài khoản" : "Kích hoạt tài khoản"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal xác nhận Khóa / Mở khóa tài khoản người dùng */}
      {accountToToggle && (
        <Modal
          open={Boolean(accountToToggle)}
          onOpenChange={(open) => {
            if (!open) setAccountToToggle(null);
          }}
          title={accountToToggle.isActive ? "Xác nhận tạm khóa tài khoản" : "Xác nhận kích hoạt tài khoản"}
        >
          <div className="space-y-4 py-2">
            <p className="text-xs sm:text-sm text-slate-600">
              {accountToToggle.isActive ? (
                <>
                  Bạn có chắc chắn muốn <strong>tạm khóa</strong> tài khoản của người dùng{" "}
                  <strong className="text-slate-900">@{accountToToggle.username}</strong>
                  {accountToToggle.profile?.fullName ? ` (${accountToToggle.profile.fullName})` : ""}? Người dùng sẽ không thể đăng nhập vào hệ thống khi tài khoản bị khóa.
                </>
              ) : (
                <>
                  Bạn có chắc chắn muốn <strong>kích hoạt lại</strong> tài khoản của người dùng{" "}
                  <strong className="text-slate-900">@{accountToToggle.username}</strong>
                  {accountToToggle.profile?.fullName ? ` (${accountToToggle.profile.fullName})` : ""}?
                </>
              )}
            </p>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setAccountToToggle(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={Boolean(togglingId)}
                onClick={confirmToggleAccountStatus}
                className={`px-4 py-2 text-xs font-bold rounded-lg text-white transition-colors disabled:opacity-50 ${
                  accountToToggle.isActive
                    ? "bg-amber-700 hover:bg-amber-800"
                    : "bg-emerald-700 hover:bg-emerald-800"
                }`}
              >
                {togglingId ? "Đang xử lý..." : accountToToggle.isActive ? "Tạm khóa tài khoản" : "Kích hoạt tài khoản"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Overview({ onSelect, wardsCount }: { onSelect: (id: SectionId) => void; wardsCount?: number }) {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditLoading, setAuditLoading] = useState(true);
  const [auditError, setAuditError] = useState('');
  const [auditUsers, setAuditUsers] = useState<Record<string, string>>({});
  const [auditRoles, setAuditRoles] = useState<Record<number, string>>({});
  const [auditPermissions, setAuditPermissions] = useState<Record<number, string>>({});
  const [userCount, setUserCount] = useState<number>();
  const [wardTotal, setWardTotal] = useState<number | undefined>(wardsCount);

  const proceduresQuery = usePublicProcedureList({ pageNumber: 1, pageSize: 1 });
  const procedureCount = proceduresQuery.data?.totalCount;

  const loadAuditLogs = useCallback(async () => {
    setAuditLoading(true);
    setAuditError('');
    try {
      const [audit, roles, permissions] = await Promise.all([
        rbacApi.audit(1, 5),
        rbacApi.roles(1, 100).catch(() => null),
        rbacApi.permissions().catch(() => null),
      ]);
      setAuditLogs(audit.items);
      setAuditRoles(Object.fromEntries(roles?.items.map((role) => [role.id, roleLabels[role.roleName] ?? role.roleName]) ?? []));
      setAuditPermissions(Object.fromEntries(permissions?.map((permission) => [permission.id, permission.permissionName]) ?? []));
      const userIds = [...new Set(audit.items.flatMap((log) => [log.actorUserId, log.targetUserId].filter((id): id is string => Boolean(id))))];
      const users = await Promise.all(userIds.map(async (id) => {
        try {
          return [id, (await getAccount(id)).username] as const;
        } catch {
          return [id, ''] as const;
        }
      }));
      setAuditUsers(Object.fromEntries(users));
    } catch (error) {
      setAuditError(rbacError(error));
    } finally {
      setAuditLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAuditLogs();
    void getAdminUsers({ page: 1, pageSize: 1 }).then(({ total }) => setUserCount(total)).catch(() => setUserCount(undefined));
    if (wardsCount === undefined) {
      void getWards().then((data) => setWardTotal(data.length)).catch(() => setWardTotal(undefined));
    } else {
      setWardTotal(wardsCount);
    }
  }, [loadAuditLogs, wardsCount]);

  const stats = [
    {
      label: 'Thủ tục đang áp dụng',
      value: procedureCount !== undefined ? procedureCount.toLocaleString('vi-VN') : (proceduresQuery.isLoading ? '...' : '—'),
      icon: ClipboardText,
      tone: 'info',
    },
    {
      label: 'Tài khoản nội bộ',
      value: userCount !== undefined ? userCount.toLocaleString('vi-VN') : '—',
      icon: Users,
      tone: 'success',
    },
    {
      label: 'Đơn vị Phường / Xã',
      value: wardTotal !== undefined ? wardTotal.toLocaleString('vi-VN') : '—',
      icon: Buildings,
      tone: 'warning',
    },
  ];

  const shortcuts: Array<{ id: SectionId; title: string; icon: typeof House }> = [
    { id: 'procedures', title: 'Danh sách thủ tục', icon: ClipboardText },
    { id: 'knowledge', title: 'Dữ liệu kiến thức AI', icon: Books },
    { id: 'accounts', title: 'Tài khoản đăng nhập', icon: Key },
    { id: 'users', title: 'Người dùng hệ thống', icon: Users },
    { id: 'wards', title: 'Đơn vị Phường / Xã', icon: Buildings },
    { id: 'roles', title: 'Vai trò & quyền hạn', icon: ShieldCheck },
  ];

  return (
    <>
      <section className="admin-stat-grid xl:grid-cols-3!" aria-label="Chỉ số tổng quan">
        {stats.map(({ label, value, icon: Icon, tone }) => (
          <article key={label} className={`admin-stat-card is-${tone}`}>
            <div>
              <span>
                <Icon size={24} weight="duotone" />
              </span>
              <small>{label}</small>
            </div>
            <strong>{value}</strong>
          </article>
        ))}
      </section>

      <section className="admin-card admin-module-card">
        <div className="admin-card-heading">
          <div>
            <h2>Phân hệ quản trị</h2>
          </div>
        </div>
        <div className="admin-module-grid">
          {shortcuts.map(({ id, title, icon: Icon }) => (
            <button key={id} type="button" onClick={() => onSelect(id)}>
              <span>
                <Icon size={22} weight="duotone" />
              </span>
              <div>
                <strong>{title}</strong>
              </div>
              <CaretDown size={16} />
            </button>
          ))}
        </div>
      </section>

      <section className="mt-4">
        <article className="admin-card">
          <div className="admin-card-heading">
            <div>
              <h2>Phân quyền gần đây</h2>
            </div>
            <button type="button" onClick={() => onSelect('audit')}>
              Xem nhật ký
            </button>
          </div>
          <div className="divide-y divide-slate-100 px-5">
            {auditLoading && Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex min-h-14 items-center gap-3 py-3" aria-hidden="true">
                <span className="size-8 shrink-0 animate-pulse rounded-full bg-slate-100" />
                <span className="h-4 flex-1 animate-pulse rounded bg-slate-100" />
              </div>
            ))}
            {!auditLoading && auditError && (
              <div className="flex min-h-20 items-center justify-between gap-3 py-4 text-sm text-red-700" role="alert">
                <span>Không thể tải hoạt động gần đây.</span>
                <button type="button" className="font-bold hover:underline" onClick={() => void loadAuditLogs()}>
                  Thử lại
                </button>
              </div>
            )}
            {!auditLoading && !auditError && auditLogs.map((log) => (
              <div key={log.id} className="flex min-h-[72px] items-center gap-3 py-3">
                <span className={`flex size-9 shrink-0 items-center justify-center rounded-full ${/revoked|deleted|disabled/.test(log.action) ? 'bg-amber-50 text-amber-700' : /granted|assigned|created|enabled/.test(log.action) ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'}`}>
                  <ClockCounterClockwise size={16} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-900">
                    {actionLabels[log.action] ?? log.action}
                    {log.permissionId && auditPermissions[log.permissionId] ? `: ${auditPermissions[log.permissionId]}` : ''}
                    {!log.permissionId && log.targetUserId && auditUsers[log.targetUserId] ? `: @${auditUsers[log.targetUserId]}` : ''}
                    {!log.permissionId && !log.targetUserId && log.roleId && auditRoles[log.roleId] ? `: ${auditRoles[log.roleId]}` : ''}
                  </p>
                  <p className="mt-1 truncate text-xs text-slate-500">
                    {auditUsers[log.actorUserId] ? `Thực hiện bởi @${auditUsers[log.actorUserId]}` : 'Thao tác quản trị'}
                    {log.roleId && auditRoles[log.roleId] ? ` · Vai trò ${auditRoles[log.roleId]}` : ''}
                  </p>
                </div>
                <time className="shrink-0 text-right text-xs leading-5 text-slate-500" dateTime={log.createdAt}>
                  <span className="block font-semibold text-slate-700">{new Date(log.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                  <span>{new Date(log.createdAt).toLocaleDateString('vi-VN')}</span>
                </time>
              </div>
            ))}
            {!auditLoading && !auditError && auditLogs.length === 0 && (
              <p className="py-5 text-sm text-slate-500">Chưa có hoạt động quản trị nào.</p>
            )}
          </div>
        </article>
      </section>
    </>
  );
}

function SearchBar({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="admin-search">
      <MagnifyingGlass size={18} />
      <span className="sr-only">Tìm kiếm</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}



interface SystemRoleConfig {
  value: string;
  label: string;
  keywords: string[];
  badgeClass: string;
}

const SYSTEM_ROLE_CONFIGS: SystemRoleConfig[] = [
  {
    value: 'ADMIN',
    label: 'Quản trị viên',
    keywords: ['ADMIN', 'QUẢN TRỊ'],
    badgeClass: 'bg-red-50 text-red-800 border-red-200',
  },
  {
    value: 'MANAGER',
    label: 'Quản lý cán bộ',
    keywords: ['MANAGER', 'LÃNH ĐẠO'],
    badgeClass: 'bg-blue-50 text-blue-800 border-blue-200',
  },
  {
    value: 'FRONT_DESK_OFFICER',
    label: 'Cán bộ Một cửa',
    keywords: ['FRONT_DESK', 'FRONTDESK', 'OFFICER', 'MỘT CỬA'],
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  {
    value: 'PROCEDURE_MANAGER',
    label: 'Quản lý thủ tục',
    keywords: ['PROCEDURE', 'THỦ TỤC'],
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  {
    value: 'REGISTERED_CITIZEN',
    label: 'Công dân',
    keywords: ['CITIZEN', 'CÔNG DÂN'],
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
  },
];

const ROLE_FILTER_OPTIONS = [
  { value: 'ALL', label: 'Tất cả vai trò' },
  ...SYSTEM_ROLE_CONFIGS.filter((c) => c.value !== 'ADMIN').map((c) => ({ value: c.value, label: c.label })),
];

function getRoleConfig(rawName: string): SystemRoleConfig | undefined {
  if (!rawName) return undefined;
  const upper = rawName.toUpperCase();
  if (upper.includes('FRONT_DESK') || upper.includes('FRONTDESK') || upper.includes('OFFICER') || upper.includes('MỘT CỬA')) {
    return SYSTEM_ROLE_CONFIGS.find((c) => c.value === 'FRONT_DESK_OFFICER');
  }
  if (upper.includes('PROCEDURE') || upper.includes('THỦ TỤC')) {
    return SYSTEM_ROLE_CONFIGS.find((c) => c.value === 'PROCEDURE_MANAGER');
  }
  return SYSTEM_ROLE_CONFIGS.find((c) => c.keywords.some((k) => upper.includes(k)));
}

function formatRoleLabel(roleName: string): string {
  if (!roleName) return 'Chưa phân vai trò';
  const config = getRoleConfig(roleName);
  return config ? config.label : roleName;
}

function getRoleBadgeClass(roleName: string): string {
  const config = getRoleConfig(roleName);
  return config ? config.badgeClass : 'bg-slate-100 text-slate-700 border-slate-200';
}


function AccountsView({
  query,
  setQuery,
  accounts,
  wards,
  total,
  page,
  pageSize,
  loading,
  error,
  togglingId,
  onPageChange,
  onRetry,
  onToggleStatus,
  onCreateStaff,
}: {
  query: string;
  setQuery: (value: string) => void;
  accounts: AccountItem[];
  wards: WardDto[];
  total: number;
  page: number;
  pageSize: number;
  loading: boolean;
  error: string | null;
  togglingId: string | null;
  onPageChange: (page: number) => void;
  onRetry: () => void;
  onToggleStatus: (account: AccountItem) => void;
  onCreateStaff?: () => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const displayAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      if (statusFilter === 'ACTIVE' && !acc.isActive) return false;
      if (statusFilter === 'LOCKED' && acc.isActive) return false;
      if (query.trim()) {
        const q = query.toLowerCase().trim();
        const matchUsername = acc.username.toLowerCase().includes(q);
        const matchEmail = acc.email?.toLowerCase().includes(q);
        return matchUsername || matchEmail;
      }
      return true;
    });
  }, [accounts, statusFilter, query]);

  return (
    <section className="admin-card admin-table-card admin-content-card">
      <div className="admin-toolbar flex flex-wrap items-center justify-between gap-3 p-4 border-b border-slate-100">
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Tìm tên đăng nhập hoặc email..."
        />
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-3 text-xs font-semibold bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-800"
            aria-label="Lọc theo trạng thái"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="LOCKED">Đang tạm khóa</option>
          </select>

          <button
            type="button"
            onClick={onRetry}
            disabled={loading}
            className="inline-flex items-center gap-1.5 h-10 px-3.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-700 transition-colors"
            aria-label="Tải lại danh sách"
          >
            <ArrowsClockwise size={16} className={loading ? 'animate-spin text-red-800' : ''} />
            <span>{loading ? 'Đang tải...' : 'Làm mới'}</span>
          </button>

          {onCreateStaff && (
            <button
              type="button"
              onClick={onCreateStaff}
              className="inline-flex items-center gap-1.5 h-10 px-4 text-xs font-bold rounded-lg bg-red-800 hover:bg-red-900 text-white shadow-xs transition-colors"
            >
              <Plus size={16} weight="bold" />
              <span>Thêm cán bộ mới</span>
            </button>
          )}
        </div>
      </div>

      {error ? (
        <div className="p-8 text-center space-y-3">
          <p className="text-sm text-rose-600 font-medium">{error}</p>
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-red-800 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
          >
            <ArrowsClockwise size={14} />
            <span>Thử lại</span>
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="admin-table w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/75 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="px-4 py-3">Tên đăng nhập</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Đơn vị Phường / Xã</th>
                <th className="px-4 py-3">Ngày tạo</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <TableSkeletonRows
                  rows={5}
                  columns={6}
                  columnWidths={['w-36', 'w-48', 'w-36', 'w-28', 'w-24', 'w-20']}
                  lastCellClassName="text-right"
                />
              ) : displayAccounts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    Không tìm thấy tài khoản đăng nhập phù hợp.
                  </td>
                </tr>
              ) : (
                displayAccounts.map((account) => {
                  const ward = wards.find((w) => w.id === account.wardId);
                  const isToggling = togglingId === account.id;

                  return (
                    <tr key={account.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3.5 font-bold text-slate-900 font-mono">
                        @{account.username}
                      </td>
                      <td className="px-4 py-3.5 text-slate-700">{account.email}</td>
                      <td className="px-4 py-3.5 text-slate-600">
                        {ward ? (
                          <span className="font-medium text-slate-800">{ward.name}</span>
                        ) : (
                          <span className="text-slate-400 italic">— Chưa gán —</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 font-mono text-[11px]">
                        {new Date(account.createdAt).toLocaleDateString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-4 py-3.5">
                        {account.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                            <span className="size-1.5 rounded-full bg-emerald-500" />
                            Hoạt động
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">
                            <span className="size-1.5 rounded-full bg-rose-500" />
                            Tạm khóa
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          type="button"
                          disabled={isToggling}
                          onClick={() => onToggleStatus(account)}
                          className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold transition-colors ${
                            account.isActive
                              ? 'text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200'
                              : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
                          }`}
                        >
                          {isToggling ? 'Đang lưu...' : account.isActive ? 'Khóa tài khoản' : 'Mở khóa'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Footer */}
      {!loading && !error && total > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-t border-slate-100 text-xs text-slate-500">
          <span>
            Trang <strong>{page}</strong> / <strong>{totalPages}</strong> (Tổng cộng <strong>{total}</strong> tài khoản)
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40"
            >
              Trước
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40"
            >
              Sau
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function UsersView({
  query,
  setQuery,
  users,
  wards,
  total,
  page,
  pageSize,
  loading,
  error,
  togglingId,
  onPageChange,
  onRetry,
  onToggleStatus,
  onAssignWard,
  onSelectUser,
  onManageRoles,
  roleFilter,
  onRoleFilterChange,
  onCreateStaff,
}: {
  query: string;
  setQuery: (value: string) => void;
  users: ManagedUserDto[];
  wards: WardDto[];
  total: number;
  page: number;
  pageSize: number;
  loading: boolean;
  error: string | null;
  togglingId: string | null;
  onPageChange: (page: number) => void;
  onRetry: () => void;
  onToggleStatus: (user: ManagedUserDto) => void;
  onAssignWard: (userId: string, wardId: string | null) => void;
  onSelectUser: (user: ManagedUserDto) => void;
  onManageRoles: (user: ManagedUserDto) => void;
  roleFilter: string;
  onRoleFilterChange: (value: string) => void;
  onCreateStaff?: () => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Vai trò lọc phía server; trạng thái chỉ lọc trong trang hiện tại (BE chưa có tham số isActive).
  const [statusFilter, setStatusFilter] = useState<string>('ACTIVE');

  const displayUsers = useMemo(() => {
    return users.filter((u) => {
      if (statusFilter === 'ACTIVE' && !u.isActive) return false;
      if (statusFilter === 'LOCKED' && u.isActive) return false;
      return true;
    });
  }, [users, statusFilter]);

  return (
    <section className="admin-card admin-table-card admin-content-card">
      <div className="admin-toolbar flex flex-wrap items-center justify-between gap-3 p-4 border-b border-slate-100">
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Tìm tên đăng nhập, họ tên, email hoặc phường..."
        />
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={roleFilter}
            onChange={(e) => onRoleFilterChange(e.target.value)}
            className="h-10 px-3 text-xs font-semibold bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-800"
            aria-label="Lọc theo vai trò"
          >
            {ROLE_FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-3 text-xs font-semibold bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-800"
            aria-label="Lọc theo trạng thái"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="LOCKED">Đang tạm khóa</option>
          </select>

          <button
            type="button"
            onClick={onRetry}
            disabled={loading}
            className="inline-flex items-center gap-1.5 h-10 px-3.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-700 transition-colors"
            aria-label="Tải lại danh sách"
          >
            <ArrowsClockwise size={16} className={loading ? 'animate-spin text-red-800' : ''} />
            <span>{loading ? 'Đang tải...' : 'Làm mới'}</span>
          </button>
          {onCreateStaff && (
            <button type="button" onClick={onCreateStaff} className="admin-primary-action h-10 text-xs">
              <Plus size={16} weight="bold" /> Tạo tài khoản cán bộ
            </button>
          )}
        </div>
      </div>

      {/* Lỗi */}
      {error && !loading && (
        <div className="m-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 flex items-center justify-between gap-4">
          <span>{error}</span>
          <button
            type="button"
            onClick={onRetry}
            className="shrink-0 rounded-lg border border-red-300 px-3 py-1 text-xs font-bold text-red-800 hover:bg-red-100"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Bảng danh sách người dùng */}
      {!error && (
        <div className="admin-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Người dùng</th>
                <th>Vai trò & Đơn vị</th>
                <th>Trạng thái</th>
                <th className="text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeletonRows
                  columns={4}
                  rows={5}
                  columnWidths={['w-40', 'w-36', 'w-20', 'ml-auto w-24']}
                  lastCellClassName="text-right"
                />
              ) : (
                displayUsers.map((item) => {
                const isToggling = togglingId === item.id;
                const hasCustomName = Boolean(item.profile?.fullName && item.profile.fullName.trim() !== item.username);
                const displayName = hasCustomName ? item.profile!.fullName : item.username;
                const initials = displayName.slice(0, 2).toUpperCase();
                const isStaff = item.roles.some((r) => {
                  const cfg = getRoleConfig(r.roleName);
                  return cfg?.value === 'MANAGER' || cfg?.value === 'FRONT_DESK_OFFICER';
                });
                return (
                  <tr key={item.id}>
                    <td>
                      <div className="admin-person">
                        <span>{initials}</span>
                        <div>
                          {hasCustomName ? (
                            <>
                              <p>
                                <strong>{displayName}</strong>
                              </p>
                              <small className="text-slate-500 font-mono text-[11px]">@{item.username}</small>
                            </>
                          ) : (
                            <p>
                              <strong className="font-mono text-slate-800">@{item.username}</strong>
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap gap-1">
                          {item.roles.length > 0 ? (
                            item.roles.map((r) => (
                              <span
                                key={r.id}
                                className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${getRoleBadgeClass(
                                  r.roleName
                                )}`}
                              >
                                {formatRoleLabel(r.roleName)}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </div>
                        {isStaff && (
                          <div className="flex items-center gap-1.5">
                            <Buildings size={14} className="text-slate-400 shrink-0" />
                            {(() => {
                              const assignedWardId =
                                item.wardId ||
                                (item.wardCode
                                  ? wards.find(
                                      (w) =>
                                        w.code.trim().toUpperCase() ===
                                        item.wardCode?.trim().toUpperCase()
                                    )?.id
                                  : '') ||
                                '';
                              return (
                                <select
                                  value={assignedWardId}
                                  onChange={(e) => onAssignWard(item.id, e.target.value || null)}
                                  className="text-[11px] bg-slate-50 hover:bg-white border border-slate-200 rounded px-1.5 py-0.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-red-800"
                                  title="Gán đơn vị phường công tác cho cán bộ"
                                >
                                  <option value="">(Chưa gán phường)</option>
                                  {wards.map((w) => (
                                    <option key={w.id} value={w.id}>
                                      {w.name}
                                    </option>
                                  ))}
                                </select>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <span
                        className={`admin-status-badge ${
                          item.isActive ? 'is-success' : 'is-warning'
                        }`}
                      >
                        {item.isActive ? 'Hoạt động' : 'Tạm khóa'}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onManageRoles(item)}
                          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-red-900 transition-colors"
                        >
                          Phân vai trò
                        </button>
                        <button
                          type="button"
                          onClick={() => onSelectUser(item)}
                          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-red-900 transition-colors"
                        >
                          Xem chi tiết
                        </button>
                        <button
                          type="button"
                          disabled={isToggling || togglingId !== null}
                          onClick={() => onToggleStatus(item)}
                          className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors disabled:opacity-50 ${
                            item.isActive
                              ? 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100'
                              : 'border-green-300 bg-green-50 text-green-800 hover:bg-green-100'
                          }`}
                          aria-label={item.isActive ? `Tạm khóa tài khoản ${item.username}` : `Kích hoạt tài khoản ${item.username}`}
                        >
                          {isToggling
                            ? 'Đang xử lý...'
                            : item.isActive ? 'Tạm khóa' : 'Kích hoạt'
                          }
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && displayUsers.length === 0 && (
        <p className="admin-empty p-8 text-center text-xs text-slate-500">
          {query || roleFilter !== 'ALL'
            ? 'Không tìm thấy người dùng phù hợp với bộ lọc tìm kiếm hoặc vai trò.'
            : 'Chưa có người dùng nào trong phạm vi quản lý.'}
        </p>
      )}

      {/* Phân trang */}
      {!loading && !error && totalPages > 1 && (
        <div className="flex items-center justify-between gap-2 border-t border-slate-100 p-4 text-xs text-slate-600">
          <span>Trang {page} / {totalPages} · Tổng {total} người dùng</span>
          <div className="flex gap-1">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
            >
              ‹ Trước
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
            >
              Sau ›
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function WardsView({
  wards,
  loading = false,
  onRetry,
  onWardCreated,
}: {
  wards: WardDto[];
  loading?: boolean;
  onRetry: () => void;
  onWardCreated: () => void;
}) {
  const [query, setQuery] = useState('');
  const [wardModalOpen, setWardModalOpen] = useState(false);
  const [wardSubmitting, setWardSubmitting] = useState(false);
  const [wardInput, setWardInput] = useState({ code: '', name: '' });
  // Đếm theo `total` của /admin/users?wardCode=… (pageSize 1); gọi song song, không chặn hiển thị bảng.
  const [staffCounts, setStaffCounts] = useState<Record<string, number | null>>({});
  useEffect(() => {
    let cancelled = false;
    setStaffCounts({});
    for (const ward of wards) {
      getAdminUsers({ wardCode: ward.code, page: 1, pageSize: 1 })
        .then((page) => page.total, () => null)
        .then((total) => { if (!cancelled) setStaffCounts((current) => ({ ...current, [ward.id]: total })); });
    }
    return () => { cancelled = true; };
  }, [wards]);

  const filteredWards = useMemo(() => {
    const q = query.toLowerCase();
    return wards.filter(
      (w) => w.name.toLowerCase().includes(q) || w.code.toLowerCase().includes(q)
    );
  }, [wards, query]);

  async function handleCreateWard(e: React.FormEvent) {
    e.preventDefault();
    if (!wardInput.code.trim() || !wardInput.name.trim()) {
      toast.error('Vui lòng điền mã và tên phường.');
      return;
    }
    setWardSubmitting(true);
    try {
      await createWard({
        code: wardInput.code.trim().toUpperCase(),
        name: wardInput.name.trim(),
      });
      toast.success(`Đã khởi tạo phường ${wardInput.name}.`);
      setWardModalOpen(false);
      setWardInput({ code: '', name: '' });
      onWardCreated();
    } catch (err) {
      toast.error(authErrorMessage(err));
    } finally {
      setWardSubmitting(false);
    }
  }

  return (
    <section className="admin-card admin-table-card admin-content-card">
      <div className="admin-toolbar flex flex-wrap items-center justify-between gap-3 p-4 border-b border-slate-100">
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Tìm theo tên hoặc mã phường / xã..."
        />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRetry}
            disabled={loading}
            className="inline-flex items-center gap-1.5 h-10 px-3.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-700 transition-colors"
            aria-label="Tải lại danh sách phường"
          >
            <ArrowsClockwise size={16} className={loading ? 'animate-spin text-red-800' : ''} />
            <span>{loading ? 'Đang tải...' : 'Làm mới'}</span>
          </button>
          <button
            type="button"
            onClick={() => setWardModalOpen(true)}
            className="admin-primary-action h-10 text-xs"
          >
            <Plus size={16} weight="bold" /> Thêm Phường / Xã mới
          </button>
        </div>
      </div>

      {/* Bảng danh sách phường */}
      <div className="admin-table-wrap">
        <table>
          <thead>
            <tr>
              <th className="min-w-[130px]">Mã phường</th>
              <th className="min-w-[200px]">Tên đơn vị Phường / Xã</th>
              <th className="min-w-[160px]">Số cán bộ & Nhân sự</th>
              <th className="min-w-[110px] text-right">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeletonRows
                columns={4}
                rows={5}
                columnWidths={['w-24 font-mono', 'w-48', 'w-36', 'ml-auto w-20']}
                lastCellClassName="text-right"
              />
            ) : (
              filteredWards.map((w) => {
                const count = staffCounts[w.id];
                return (
                  <tr key={w.id}>
                    <td>
                      <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2 py-1 rounded border border-slate-200">
                        {w.code}
                      </span>
                    </td>
                    <td>
                      <strong className="text-slate-900 text-xs">{w.name}</strong>
                    </td>
                    <td>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700">
                        {count === undefined
                          ? <Skeleton className="h-4 w-24" />
                          : count === null
                            ? <span className="text-slate-400">Không tải được</span>
                            : <><span className="font-bold text-red-900">{count}</span> nhân sự trực thuộc</>}
                      </span>
                    </td>
                    <td>
                      <span className="admin-status-badge is-success">
                        Hoạt động
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {!loading && filteredWards.length === 0 && (
        <p className="admin-empty p-8 text-center text-xs text-slate-500">
          {query ? 'Không tìm thấy phường / xã phù hợp.' : 'Chưa có đơn vị phường / xã nào được khởi tạo.'}
        </p>
      )}

      {/* Modal tạo Phường công tác mới (API 57) */}
      {wardModalOpen && (
        <Modal
          open={wardModalOpen}
          onOpenChange={setWardModalOpen}
          title="Thêm Phường / Xã mới"
        >
          <form onSubmit={handleCreateWard} className="space-y-4 py-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mã phường * (viết hoa không dấu, số, gạch nối hoặc gạch dưới)
              </label>
              <input
                type="text"
                required
                maxLength={50}
                placeholder="Ví dụ: PHUONG_BEN_NGHE"
                value={wardInput.code}
                onChange={(e) => {
                  const sanitized = e.target.value
                    .toUpperCase()
                    .replace(/\s+/g, '_')
                    .replace(/[^A-Z0-9_-]/g, '');
                  setWardInput({ ...wardInput, code: sanitized });
                }}
                className="w-full h-10 px-3 text-xs font-mono uppercase bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tên phường *
              </label>
              <input
                type="text"
                required
                maxLength={255}
                placeholder="Ví dụ: Phường Bến Nghé"
                value={wardInput.name}
                onChange={(e) => setWardInput({ ...wardInput, name: e.target.value })}
                className="w-full h-10 px-3 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800"
              />
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setWardModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 rounded-lg border border-slate-200 hover:bg-slate-50"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={wardSubmitting}
                className="admin-primary-action text-xs disabled:opacity-50"
              >
                {wardSubmitting ? 'Đang khởi tạo...' : 'Khởi tạo'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </section>
  );
}

