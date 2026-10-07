import { UserDropdown } from '@/components/layout/UserDropdown';
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useUserProfile } from "@/hooks/useUserProfile";
import { getGreeting } from "@/lib/utils";
import {
  ArrowsClockwise,
  Bell,
  Books,
  Buildings,
  CaretDown,
  ClipboardText,
  CloudArrowUp,
  Database,
  FileCode,
  FileText,
  Gear,
  House,
  Key,
  List,
  MagnifyingGlass,
  Plus,
  Pulse as Activity,
  ClockCounterClockwise,
  Robot,
  ShieldCheck,
  SidebarSimple,
  Stack,
  UserCircle,
  Users,
  X,
} from "@phosphor-icons/react";
import { toast } from "@/components/ui/Toast";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BrandMark } from "@/components/brand/BrandMark";
import { BrandWordmark } from "@/components/brand/BrandWordmark";
import { Modal } from "@/components/ui/Modal";
import {
  getManagedUsers,
  getAdminProfile,
  updateAccountStatus,
  getWards,
  createWard,
  assignUserWard,
  authErrorMessage,
  type ManagedUserDto,
  type ManagedUserPage,
  type WardDto,
  type UserProfileDto,
} from "@/lib/api";
import { ManagerProfileDetailView } from '@/pages/manager/views/ManagerProfileDetailView';
import { UnifiedSelfProfileView } from '@/components/profile/UnifiedSelfProfileView';
import type { ManagerProfileItem } from '@/pages/manager/types';

type SectionId =
  | "overview"
  | "procedures"
  | "forms"
  | "knowledge"
  | "users"
  | "wards"
  | "roles"
  | "integrations"
  | "audit"
  | "backup"
  | "profile";

const navigation: Array<{
  group: string;
  items: Array<{
    id: SectionId;
    label: string;
    icon: typeof House;
    badge?: string;
  }>;
}> = [
  {
    group: "Tổng quan",
    items: [{ id: "overview", label: "Tổng quan", icon: House }],
  },
  {
    group: "Nội dung nghiệp vụ",
    items: [
      {
        id: "procedures",
        label: "Thủ tục hành chính",
        icon: ClipboardText,
        badge: "126",
      },
      { id: "forms", label: "Biểu mẫu & E-form", icon: FileCode },
      {
        id: "knowledge",
        label: "Pháp lý & tri thức AI",
        icon: Books,
        badge: "3",
      },
    ],
  },
  {
    group: "Tài khoản & truy cập",
    items: [
      { id: "users", label: "Người dùng hệ thống", icon: Users },
      { id: "wards", label: "Đơn vị Phường / Xã", icon: Buildings },
      { id: "roles", label: "Vai trò & quyền hạn", icon: Key },
    ],
  },
  {
    group: "Vận hành hệ thống",
    items: [
      { id: "integrations", label: "Dịch vụ tích hợp", icon: Stack },
      { id: "audit", label: "Nhật ký hoạt động", icon: ClockCounterClockwise },
      { id: "backup", label: "Bảo mật & sao lưu", icon: Database },
      { id: "profile", label: "Hồ sơ cá nhân", icon: UserCircle },
    ],
  },
];

const procedures = [
  {
    code: "1.001193",
    name: "Đăng ký khai sinh",
    field: "Hộ tịch",
    updated: "16/09/2026",
    status: "Đang áp dụng",
  },
  {
    code: "2.000815",
    name: "Chứng thực bản sao từ bản chính",
    field: "Chứng thực",
    updated: "14/09/2026",
    status: "Đang áp dụng",
  },
  {
    code: "1.000894",
    name: "Đăng ký kết hôn",
    field: "Hộ tịch",
    updated: "10/09/2026",
    status: "Đang áp dụng",
  },
  {
    code: "2.001123",
    name: "Xác nhận tình trạng hôn nhân",
    field: "Hộ tịch",
    updated: "08/09/2026",
    status: "Bản nháp",
  },
];



const auditLogs = [
  {
    time: "17/09/2026 · 09:42",
    actor: "Trần Quốc Bảo",
    action: "Cập nhật thủ tục",
    target: "Đăng ký khai sinh",
    ip: "10.10.24.18",
  },
  {
    time: "17/09/2026 · 09:15",
    actor: "Nguyễn Minh Anh",
    action: "Thay đổi vai trò",
    target: "Lê Thu Hà",
    ip: "10.10.24.06",
  },
  {
    time: "17/09/2026 · 08:30",
    actor: "Hệ thống",
    action: "Đồng bộ tri thức RAG",
    target: "Nghị định 104/2022",
    ip: "Internal",
  },
  {
    time: "16/09/2026 · 23:00",
    actor: "Hệ thống",
    action: "Sao lưu định kỳ",
    target: "wardmate-prod",
    ip: "Internal",
  },
];

const services = [
  {
    name: "AI Assistant / RAG",
    status: "Hoạt động",
    meta: "Phản hồi 1,2 giây",
  },
  {
    name: "OCR nhận dạng giấy tờ",
    status: "Hoạt động",
    meta: "Độ chính xác 97,8%",
  },
  {
    name: "Kết xuất PDF & QR",
    status: "Hoạt động",
    meta: "1.248 lượt tháng này",
  },
  { name: "SMS Gateway", status: "Cảnh báo", meta: "12 tin đang chờ" },
];

const roles = [
  {
    name: "Quản trị hệ thống",
    users: 3,
    permissions: "Toàn quyền",
    tone: "danger",
  },
  { name: "Quản lý thủ tục", users: 8, permissions: "18 quyền", tone: "info" },
  {
    name: "Cán bộ Một cửa",
    users: 24,
    permissions: "12 quyền",
    tone: "success",
  },
  {
    name: "Quản lý báo cáo",
    users: 5,
    permissions: "6 quyền",
    tone: "warning",
  },
];

type ChartRange = "day" | "week" | "month" | "year";

const chartData: Record<
  ChartRange,
  Array<{ label: string; searches: number; applications: number }>
> = {
  day: [
    { label: "00:00", searches: 18, applications: 4 },
    { label: "04:00", searches: 12, applications: 2 },
    { label: "08:00", searches: 88, applications: 24 },
    { label: "12:00", searches: 112, applications: 38 },
    { label: "16:00", searches: 96, applications: 31 },
    { label: "20:00", searches: 54, applications: 17 },
    { label: "23:59", searches: 25, applications: 7 },
  ],
  week: [
    { label: "T2", searches: 214, applications: 52 },
    { label: "T3", searches: 286, applications: 76 },
    { label: "T4", searches: 248, applications: 64 },
    { label: "T5", searches: 318, applications: 88 },
    { label: "T6", searches: 292, applications: 72 },
    { label: "T7", searches: 168, applications: 40 },
    { label: "CN", searches: 124, applications: 28 },
  ],
  month: [
    { label: "Tuần 1", searches: 920, applications: 214 },
    { label: "Tuần 2", searches: 1080, applications: 268 },
    { label: "Tuần 3", searches: 1260, applications: 306 },
    { label: "Tuần 4", searches: 1140, applications: 284 },
    { label: "Tuần 5", searches: 680, applications: 172 },
  ],
  year: [
    { label: "T1", searches: 3180, applications: 742 },
    { label: "T2", searches: 3460, applications: 816 },
    { label: "T3", searches: 3920, applications: 948 },
    { label: "T4", searches: 4210, applications: 1034 },
    { label: "T5", searches: 4080, applications: 998 },
    { label: "T6", searches: 4560, applications: 1128 },
    { label: "T7", searches: 4380, applications: 1062 },
    { label: "T8", searches: 4720, applications: 1184 },
    { label: "T9", searches: 3620, applications: 884 },
    { label: "T10", searches: 0, applications: 0 },
    { label: "T11", searches: 0, applications: 0 },
    { label: "T12", searches: 0, applications: 0 },
  ],
};



const sectionMeta: Record<SectionId, { title: string }> = {
  overview: { title: "Tổng quan" },
  procedures: { title: "Quản lý thủ tục hành chính" },
  forms: { title: "Biểu mẫu & E-form" },
  knowledge: { title: "Pháp lý & tri thức AI" },
  users: { title: "Người dùng hệ thống" },
  wards: { title: "Quản lý đơn vị Phường / Xã" },
  roles: { title: "Vai trò & quyền hạn" },
  integrations: { title: "Dịch vụ tích hợp" },
  audit: { title: "Nhật ký hoạt động" },
  backup: { title: "Bảo mật & sao lưu" },
  profile: { title: "Hồ sơ cá nhân" },
};

export function AdminPage() {
  const [activeSection, setActiveSection] = useState<SectionId>("overview");
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

  const fetchUsers = useCallback(async (page: number) => {
    setUserLoading(true);
    setUserError(null);
    try {
      const data = await getManagedUsers(page, 20);
      setUserData(data);
    } catch (err) {
      setUserError(authErrorMessage(err));
    } finally {
      setUserLoading(false);
    }
  }, []);

  const fetchWards = useCallback(async () => {
    try {
      const data = await getWards();
      setWards(data);
    } catch {
      // Ignored or handled softly
    }
  }, []);

  useEffect(() => {
    if (activeSection === 'users' || activeSection === 'wards') {
      void fetchUsers(userPage);
      void fetchWards();
    }
  }, [activeSection, userPage, fetchUsers, fetchWards]);

  const currentUserId = useAuthStore((s) => s.user?.id);

  const filteredUsers = useMemo(() => {
    if (!userData) return [];
    const q = query.toLowerCase();
    return userData.items.filter((item) =>
      item.id !== currentUserId &&
      `${item.username} ${item.email} ${item.profile?.fullName ?? ''} ${item.wardName ?? ''}`
        .toLowerCase()
        .includes(q)
    );
  }, [userData, query, currentUserId]);

  async function handleToggleAccountStatus(account: ManagedUserDto) {
    if (togglingId) return;
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
              ? { ...u, wardId, wardName: chosenWard ? chosenWard.name : null }
              : u
          ),
        };
      });
      toast.success('Đã cập nhật phường công tác thành công.');
    } catch (err) {
      toast.error(authErrorMessage(err));
    }
  }


  const filteredProcedures = useMemo(
    () =>
      procedures.filter((item) =>
        `${item.code} ${item.name} ${item.field}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [query],
  );


  const [selectedUser, setSelectedUser] = useState<ManagedUserDto | null>(null);
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

  function selectSection(id: SectionId) {
    setActiveSection(id);
    setSelectedUser(null);
    setDetailProfile(null);
    setQuery("");
    setSidebarOpen(false);
  }

  function demoAction(message: string) {
    toast.success(message);
  }


  return (
    <div className="admin-layout">
      <a href="#admin-main" className="skip-link">
        Đến nội dung chính
      </a>
      {sidebarOpen && (
        <button
          className="admin-sidebar-overlay"
          type="button"
          aria-label="Đóng menu quản trị"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        id="admin-sidebar"
        className={`admin-sidebar ${sidebarOpen ? "is-open" : ""} ${sidebarCollapsed ? "is-compact" : ""}`}
        aria-label="Điều hướng quản trị"
      >
        <div className="admin-brand">
          <BrandMark className="admin-brand-mark" size={42} />
          <div>
            <BrandWordmark subtitle="Quản trị hệ thống" compact />
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            aria-label="Đóng menu"
          >
            <X size={21} />
          </button>
        </div>
        <nav className="admin-nav">
          {navigation.map((group) => (
            <div className="admin-nav-section" key={group.group}>
              <p>{group.group}</p>
              {group.items.map(({ id, label, icon: Icon, badge }) => (
                <button
                  key={id}
                  type="button"
                  className={activeSection === id ? "is-active" : ""}
                  aria-current={activeSection === id ? "page" : undefined}
                  onClick={() => selectSection(id)}
                  title={sidebarCollapsed ? label : undefined}
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

      <div
        className={`admin-workspace ${sidebarCollapsed ? "is-sidebar-collapsed" : ""}`}
      >
        <header className="admin-topbar">
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
            <button
              type="button"
              aria-label="Thông báo"
              onClick={() => toast.info("Bạn có 3 thông báo quản trị mới.")}
            >
              <Bell size={21} />
              <span>3</span>
            </button>
            <UserDropdown />
          </div>
        </header>

        <main id="admin-main" className="admin-main" tabIndex={-1}>
          {!(activeSection === "users" && selectedUser) && activeSection !== "profile" && (
            <div className="admin-page-heading">
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
            <Overview onSelect={selectSection} />
          )}
          {activeSection === "procedures" && (
            <ProcedureView
              query={query}
              setQuery={setQuery}
              rows={filteredProcedures}
              onAction={demoAction}
            />
          )}
          {activeSection === "forms" && <FormsView onAction={demoAction} />}
          {activeSection === "knowledge" && (
            <KnowledgeView onAction={demoAction} />
          )}
          {activeSection === "profile" && <UnifiedSelfProfileView />}
          {activeSection === "users" && (
            selectedUser ? (
              detailLoading ? (
                <div className="admin-card p-12 text-center space-y-3">
                  <ArrowsClockwise size={32} className="animate-spin text-red-800 mx-auto" />
                  <p className="text-sm font-semibold text-slate-700">Đang tải thông tin định danh & hồ sơ chi tiết...</p>
                </div>
              ) : (
                <ManagerProfileDetailView
                  profile={({
                    userId: selectedUser.id,
                    username: selectedUser.username,
                    email: selectedUser.email,
                    isActive: selectedUser.isActive,
                    fullName: detailProfile?.fullName || selectedUser.profile?.fullName || selectedUser.username,
                    identityNumber: detailProfile?.identityNumber || selectedUser.profile?.identityNumber || 'Chưa được cập nhật',
                    phoneNumber: detailProfile?.phoneNumber || selectedUser.profile?.phoneNumber || 'Chưa được cập nhật',
                    dateOfBirth: detailProfile?.dateOfBirth || selectedUser.profile?.dateOfBirth || '',
                    gender: ((detailProfile?.gender || selectedUser.profile?.gender) === 'Nữ' || (detailProfile?.gender || selectedUser.profile?.gender) === 'Khác'
                      ? (detailProfile?.gender || selectedUser.profile?.gender)
                      : 'Nam') as 'Nam' | 'Nữ' | 'Khác',
                    permanentAddress: detailProfile?.permanentAddress || selectedUser.profile?.permanentAddress || 'Chưa được cập nhật',
                    temporaryAddress: detailProfile?.temporaryAddress || selectedUser.profile?.temporaryAddress || 'Chưa được cập nhật',
                  }) as ManagerProfileItem}
                  isFrontDesk={false}
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
                onToggleStatus={handleToggleAccountStatus}
                onAssignWard={handleAssignWard}
                onSelectUser={handleOpenUserDetail}
              />
            )
          )}
          {activeSection === "wards" && (
            <WardsView
              wards={wards}
              users={userData?.items ?? []}
              onRetry={() => void fetchWards()}
              onWardCreated={() => void fetchWards()}
            />
          )}
          {activeSection === "roles" && <RolesView onAction={demoAction} />}
          {activeSection === "integrations" && (
            <IntegrationsView onAction={demoAction} />
          )}
          {activeSection === "audit" && <AuditView />}
          {activeSection === "backup" && <BackupView onAction={demoAction} />}
        </main>
      </div>

    </div>
  );
}

function Overview({ onSelect }: { onSelect: (id: SectionId) => void }) {
  const stats = [
    {
      label: "Thủ tục đang áp dụng",
      value: "126",
      icon: ClipboardText,
      tone: "info",
    },
    { label: "Tài khoản nội bộ", value: "40", icon: Users, tone: "success" },
    { label: "Nguồn tri thức AI", value: "284", icon: Robot, tone: "warning" },
    {
      label: "Cảnh báo hệ thống",
      value: "02",
      icon: ShieldCheck,
      tone: "danger",
    },
  ];
  const shortcuts: Array<{ id: SectionId; title: string; icon: typeof House }> =
    [
      { id: "procedures", title: "Thủ tục hành chính", icon: ClipboardText },
      { id: "forms", title: "Biểu mẫu & E-form", icon: FileCode },
      { id: "knowledge", title: "Tri thức AI", icon: Books },
      { id: "users", title: "Người dùng", icon: Users },
      { id: "roles", title: "Phân quyền", icon: Key },
      { id: "integrations", title: "Tích hợp", icon: Stack },
    ];
  return (
    <>
      <section className="admin-stat-grid" aria-label="Chỉ số tổng quan">
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
      <UsageChart />
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
      <section className="admin-insight-grid">
        <article className="admin-card">
          <div className="admin-card-heading">
            <div>
              <h2>Hoạt động quản trị gần đây</h2>
            </div>
            <button type="button" onClick={() => onSelect("audit")}>
              Xem nhật ký
            </button>
          </div>
          <div className="admin-activity-list">
            {auditLogs.slice(0, 3).map((log) => (
              <div key={log.time}>
                <span>{log.actor.slice(0, 1)}</span>
                <p>
                  <strong>{log.actor}</strong> {log.action.toLowerCase()}{" "}
                  <b>{log.target}</b>
                  <small>{log.time}</small>
                </p>
              </div>
            ))}
          </div>
        </article>
        <article className="admin-card">
          <div className="admin-card-heading">
            <div>
              <h2>Tình trạng dịch vụ</h2>
            </div>
          </div>
          <div className="admin-health-list">
            {services.map((service) => (
              <div key={service.name}>
                <span
                  className={
                    service.status === "Hoạt động" ? "is-online" : "is-warning"
                  }
                />
                <p>{service.name}</p>
                <strong>{service.status}</strong>
              </div>
            ))}
          </div>
        </article>
      </section>
    </>
  );
}

function UsageChart() {
  const [range, setRange] = useState<ChartRange>("week");
  const data = chartData[range];
  const totalSearches = data.reduce((total, item) => total + item.searches, 0);
  const totalApplications = data.reduce(
    (total, item) => total + item.applications,
    0,
  );
  const rangeLabels: Array<{ id: ChartRange; label: string }> = [
    { id: "day", label: "Ngày" },
    { id: "week", label: "Tuần" },
    { id: "month", label: "Tháng" },
    { id: "year", label: "Năm" },
  ];

  return (
    <section
      className="admin-card admin-chart-card"
      aria-labelledby="usage-chart-title"
    >
      <div className="admin-chart-heading">
        <div>
          <h2 id="usage-chart-title">Xu hướng sử dụng hệ thống</h2>
        </div>
        <div className="admin-chart-filters" aria-label="Khoảng thời gian">
          {rangeLabels.map((item) => (
            <button
              key={item.id}
              type="button"
              className={range === item.id ? "is-active" : ""}
              aria-pressed={range === item.id}
              onClick={() => setRange(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      <div className="admin-chart-summary">
        <div>
          <span className="is-search" />
          <p>
            <small>Lượt tra cứu</small>
            <strong>{totalSearches.toLocaleString("vi-VN")}</strong>
          </p>
        </div>
        <div>
          <span className="is-application" />
          <p>
            <small>Hồ sơ được tạo</small>
            <strong>{totalApplications.toLocaleString("vi-VN")}</strong>
          </p>
        </div>
      </div>
      <div
        className="admin-chart-canvas"
        role="img"
        aria-label={`Biểu đồ ${totalSearches.toLocaleString("vi-VN")} lượt tra cứu và ${totalApplications.toLocaleString("vi-VN")} hồ sơ được tạo theo ${rangeLabels.find((item) => item.id === range)?.label.toLowerCase()}`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 12, right: 8, left: -16, bottom: 0 }}
            accessibilityLayer
          >
            <CartesianGrid
              vertical={false}
              stroke="#e2e8f0"
              strokeDasharray="4 4"
            />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748b", fontSize: 11 }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#94a3b8", fontSize: 10 }}
              width={52}
            />
            <Tooltip
              cursor={{ stroke: "#cbd5e1", strokeDasharray: "4 4" }}
              contentStyle={{
                border: "1px solid #e2e8f0",
                borderRadius: 12,
                boxShadow: "0 12px 30px rgba(15,23,42,.10)",
                fontSize: 12,
              }}
              labelStyle={{
                color: "#0f172a",
                fontWeight: 700,
                marginBottom: 6,
              }}
              formatter={(value, name) => [
                Number(value).toLocaleString("vi-VN"),
                name === "searches" ? "Lượt tra cứu" : "Hồ sơ được tạo",
              ]}
            />
            <Area
              type="monotone"
              dataKey="searches"
              stroke="#991d18"
              strokeWidth={2.5}
              fill="#991d18"
              fillOpacity={0.08}
              activeDot={{
                r: 5,
                strokeWidth: 3,
                stroke: "#fff",
                fill: "#991d18",
              }}
            />
            <Area
              type="monotone"
              dataKey="applications"
              stroke="#c89000"
              strokeWidth={2.5}
              fill="#ffcd00"
              fillOpacity={0.07}
              activeDot={{
                r: 5,
                strokeWidth: 3,
                stroke: "#fff",
                fill: "#c89000",
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
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

function ProcedureView({
  query,
  setQuery,
  rows,
  onAction,
}: {
  query: string;
  setQuery: (value: string) => void;
  rows: typeof procedures;
  onAction: (message: string) => void;
}) {
  return (
    <section className="admin-card admin-table-card admin-content-card">
      <div className="admin-toolbar">
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Tìm theo mã, tên hoặc lĩnh vực..."
        />
        <button type="button">
          <Gear size={17} /> Bộ lọc
        </button>
      </div>
      <div className="admin-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Mã thủ tục</th>
              <th>Tên thủ tục</th>
              <th>Lĩnh vực</th>
              <th>Cập nhật</th>
              <th>Trạng thái</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr key={item.code}>
                <td>
                  <strong>{item.code}</strong>
                </td>
                <td>{item.name}</td>
                <td>{item.field}</td>
                <td>{item.updated}</td>
                <td>
                  <span
                    className={`admin-status-badge ${item.status === "Đang áp dụng" ? "is-success" : "is-warning"}`}
                  >
                    {item.status}
                  </span>
                </td>
                <td>
                  <button
                    type="button"
                    onClick={() => onAction(`Đang mở ${item.name}`)}
                  >
                    Chỉnh sửa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length === 0 && (
        <p className="admin-empty">Không tìm thấy thủ tục phù hợp.</p>
      )}
    </section>
  );
}

function FormsView({ onAction }: { onAction: (message: string) => void }) {
  const forms = [
    {
      name: "Tờ khai đăng ký khai sinh",
      version: "v3.2",
      fields: 18,
      linked: "4 thủ tục",
    },
    {
      name: "Tờ khai đăng ký kết hôn",
      version: "v2.1",
      fields: 24,
      linked: "2 thủ tục",
    },
    {
      name: "Giấy đề nghị chứng thực",
      version: "v1.8",
      fields: 12,
      linked: "6 thủ tục",
    },
  ];
  return (
    <section className="admin-card admin-content-card">
      <div className="admin-card-heading">
        <div>
          <h2>Kho biểu mẫu</h2>
        </div>
        <button
          type="button"
          onClick={() => onAction("Đã mở trình thiết kế E-form.")}
        >
          <FileCode size={17} /> Trình thiết kế
        </button>
      </div>
      <div className="admin-resource-grid">
        {forms.map((form) => (
          <article key={form.name}>
            <span>
              <FileText size={24} />
            </span>
            <div>
              <strong>{form.name}</strong>
              <small>
                {form.version} · {form.fields} trường dữ liệu · {form.linked}
              </small>
            </div>
            <button
              type="button"
              onClick={() => onAction(`Đang mở ${form.name}`)}
            >
              Cấu hình
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

function KnowledgeView({ onAction }: { onAction: (message: string) => void }) {
  const docs = [
    {
      name: "Nghị định 104/2022/NĐ-CP",
      type: "Nghị định",
      sync: "Đã đồng bộ",
      date: "15/09/2026",
    },
    {
      name: "Thông tư 01/2022/TT-BTP",
      type: "Thông tư",
      sync: "Đã đồng bộ",
      date: "12/09/2026",
    },
    {
      name: "Quy trình hộ tịch cấp xã",
      type: "Hướng dẫn",
      sync: "Chờ đồng bộ",
      date: "17/09/2026",
    },
  ];
  return (
    <div className="admin-split-view">
      <section className="admin-card">
        <div className="admin-card-heading">
          <div>
            <h2>Văn bản và nguồn tham chiếu</h2>
          </div>
          <button
            type="button"
            onClick={() => onAction("Đã mở vùng tải tài liệu.")}
          >
            <CloudArrowUp size={17} /> Tải lên
          </button>
        </div>
        <div className="admin-resource-grid is-list">
          {docs.map((doc) => (
            <article key={doc.name}>
              <span>
                <FileText size={23} />
              </span>
              <div>
                <strong>{doc.name}</strong>
                <small>
                  {doc.type} · Cập nhật {doc.date}
                </small>
              </div>
              <em
                className={
                  doc.sync === "Đã đồng bộ" ? "is-success" : "is-warning"
                }
              >
                {doc.sync}
              </em>
            </article>
          ))}
        </div>
      </section>
      <aside className="admin-card admin-sync-panel">
        <span>
          <Robot size={30} weight="duotone" />
        </span>
        <h2>Đồng bộ RAG</h2>
        <strong>281 / 284 tài liệu</strong>
        <div>
          <i style={{ width: "89%" }} />
        </div>
        <button
          type="button"
          onClick={() => onAction("Đã bắt đầu đồng bộ tri thức AI.")}
        >
          Đồng bộ ngay
        </button>
      </aside>
    </div>
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
    label: 'Lãnh đạo UBND',
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
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Bộ lọc vai trò người dùng (chuẩn hóa 5 vai trò tinh gọn)
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  const displayUsers = useMemo(() => {
    if (roleFilter === 'ALL') return users;
    return users.filter((u) =>
      u.roles.some((r) => {
        const config = getRoleConfig(r.roleName);
        return config?.value === roleFilter;
      })
    );
  }, [users, roleFilter]);

  return (
    <section className="admin-card admin-table-card admin-content-card">
      <div className="admin-toolbar flex flex-wrap items-center justify-between gap-3 p-4 border-b border-slate-100">
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Tìm tên đăng nhập, họ tên, email hoặc phường..."
        />
        <div className="flex items-center gap-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-10 px-3 text-xs font-semibold bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-800"
            aria-label="Lọc theo vai trò"
          >
            {ROLE_FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
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

      {/* Skeleton loading */}
      {loading && (
        <div className="admin-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Người dùng</th>
                <th>Vai trò & Đơn vị</th>
                <th>Trạng thái</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td><div className="h-4 w-32 animate-pulse rounded bg-slate-200" /></td>
                  <td><div className="h-4 w-28 animate-pulse rounded bg-slate-200" /></td>
                  <td><div className="h-6 w-20 animate-pulse rounded-full bg-slate-200" /></td>
                  <td><div className="h-8 w-20 animate-pulse rounded-lg bg-slate-200" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Bảng dữ liệu thật (API 54) */}
      {!loading && !error && (
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
              {displayUsers.map((item) => {
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
                            <select
                              value={item.wardId || ''}
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
              })}
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
  users,
  loading = false,
  onRetry,
  onWardCreated,
}: {
  wards: WardDto[];
  users: ManagedUserDto[];
  loading?: boolean;
  onRetry: () => void;
  onWardCreated: () => void;
}) {
  const [query, setQuery] = useState('');
  const [wardModalOpen, setWardModalOpen] = useState(false);
  const [wardSubmitting, setWardSubmitting] = useState(false);
  const [wardInput, setWardInput] = useState({ code: '', name: '' });

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
              <th className="min-w-[220px]">Mã định danh (ID)</th>
              <th className="min-w-[110px]">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {filteredWards.map((w) => {
              const count = users.filter((u) => u.wardId === w.id).length;
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
                      <span className="font-bold text-red-900">{count}</span> nhân sự trực thuộc
                    </span>
                  </td>
                  <td>
                    <span className="font-mono text-[11px] text-slate-500">{w.id}</span>
                  </td>
                  <td>
                    <span className="admin-status-badge is-success">
                      Hoạt động
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filteredWards.length === 0 && (
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
                Mã phường * (chữ in hoa, số, gạch nối)
              </label>
              <input
                type="text"
                required
                maxLength={50}
                placeholder="Ví dụ: PHUONG_BEN_NGHE"
                value={wardInput.code}
                onChange={(e) => setWardInput({ ...wardInput, code: e.target.value.toUpperCase() })}
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

function RolesView({ onAction }: { onAction: (message: string) => void }) {
  return (
    <div className="admin-role-grid">
      {roles.map((role) => (
        <article className="admin-card" key={role.name}>
          <div>
            <span className={`is-${role.tone}`}>
              <Key size={22} />
            </span>
            <button
              type="button"
              onClick={() => onAction(`Đang mở vai trò ${role.name}`)}
            >
              Chỉnh sửa
            </button>
          </div>
          <h2>{role.name}</h2>
          <footer>
            <Users size={17} />
            <strong>{role.users}</strong>
            <span>người dùng</span>
            <ShieldCheck size={17} />
            <strong>{role.permissions}</strong>
          </footer>
        </article>
      ))}
    </div>
  );
}

function IntegrationsView({
  onAction,
}: {
  onAction: (message: string) => void;
}) {
  return (
    <div className="admin-service-grid">
      {services.map((service) => (
        <article className="admin-card" key={service.name}>
          <header>
            <span
              className={
                service.status === "Hoạt động" ? "is-online" : "is-warning"
              }
            />
            {service.status}
          </header>
          <div>
            <Gear size={28} weight="duotone" />
            <h2>{service.name}</h2>
          </div>
          <footer>
            <span>{service.meta}</span>
            <button
              type="button"
              onClick={() => onAction(`Đang mở cấu hình ${service.name}`)}
            >
              Cấu hình
            </button>
          </footer>
        </article>
      ))}
    </div>
  );
}

function AuditView() {
  return (
    <section className="admin-card admin-table-card admin-content-card">
      <div className="admin-toolbar">
        <SearchBar
          value=""
          onChange={() => undefined}
          placeholder="Tìm người thực hiện, thao tác..."
        />
        <button type="button">
          <Gear size={17} /> 17/09/2026
        </button>
      </div>
      <div className="admin-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Thời gian</th>
              <th>Người thực hiện</th>
              <th>Hành động</th>
              <th>Đối tượng</th>
              <th>Địa chỉ IP</th>
            </tr>
          </thead>
          <tbody>
            {auditLogs.map((log) => (
              <tr key={log.time}>
                <td>{log.time}</td>
                <td>
                  <strong>{log.actor}</strong>
                </td>
                <td>{log.action}</td>
                <td>{log.target}</td>
                <td>
                  <code>{log.ip}</code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function BackupView({ onAction }: { onAction: (message: string) => void }) {
  return (
    <div className="admin-split-view">
      <section className="admin-card admin-security-card">
        <div className="admin-card-heading">
          <div>
            <h2>Bảo vệ dữ liệu cá nhân</h2>
          </div>
          <span className="admin-status-badge is-success">Đạt yêu cầu</span>
        </div>
        <div className="admin-security-list">
          <div>
            <ShieldCheck size={22} />
            <p>
              <strong>Mã hóa dữ liệu lưu trữ</strong>
              <small>AES-256 · Hoạt động</small>
            </p>
          </div>
          <div>
            <Key size={22} />
            <p>
              <strong>Mã hóa dữ liệu truyền tải</strong>
              <small>TLS 1.3 · Hoạt động</small>
            </p>
          </div>
          <div>
            <Activity size={22} />
            <p>
              <strong>Kiểm tra truy cập bất thường</strong>
              <small>Không phát hiện rủi ro</small>
            </p>
          </div>
        </div>
      </section>
      <section className="admin-card admin-backup-card">
        <div className="admin-card-heading">
          <div>
            <h2>Sao lưu gần nhất</h2>
          </div>
        </div>
        <div>
          <span>
            <Database size={30} weight="duotone" />
          </span>
          <strong>wardmate-prod-2026-09-16</strong>
          <p>Hoàn tất lúc 23:18 · 18,4 GB · Đã mã hóa</p>
          <div>
            <i />
          </div>
          <small>Lưu giữ 30 ngày · Bản sao tiếp theo sau 13 giờ</small>
          <button
            type="button"
            onClick={() => onAction("Đã bắt đầu tạo bản sao lưu thủ công.")}
          >
            Sao lưu ngay
          </button>
        </div>
      </section>
    </div>
  );
}

