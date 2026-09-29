import { useMemo, useState } from 'react';
import {
  Bell,
  Books,
  CaretDown,
  ClipboardText,
  CloudArrowUp,
  Database,
  FileCode,
  FileText,
  Gear,
  House,
  IdentificationCard,
  Key,
  List,
  MagnifyingGlass,
  Plus,
  Pulse as Activity,
  Robot,
  ShieldCheck,
  SidebarSimple,
  Stack,
  Users,
  X,
} from '@phosphor-icons/react';
import { toast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BrandMark } from '@/components/brand/BrandMark';
import { BrandWordmark } from '@/components/brand/BrandWordmark';

type SectionId =
  | 'overview'
  | 'procedures'
  | 'forms'
  | 'knowledge'
  | 'users'
  | 'profiles'
  | 'roles'
  | 'integrations'
  | 'audit'
  | 'backup';

const navigation: Array<{
  group: string;
  items: Array<{ id: SectionId; label: string; icon: typeof House; badge?: string }>;
}> = [
  {
    group: 'Tổng quan',
    items: [{ id: 'overview', label: 'Trung tâm quản trị', icon: House }],
  },
  {
    group: 'Nội dung nghiệp vụ',
    items: [
      { id: 'procedures', label: 'Thủ tục hành chính', icon: ClipboardText, badge: '126' },
      { id: 'forms', label: 'Biểu mẫu & E-form', icon: FileCode },
      { id: 'knowledge', label: 'Pháp lý & tri thức AI', icon: Books, badge: '3' },
    ],
  },
  {
    group: 'Tài khoản & truy cập',
    items: [
      { id: 'users', label: 'Người dùng hệ thống', icon: Users },
      { id: 'profiles', label: 'Hồ sơ công dân', icon: IdentificationCard, badge: '5' },
      { id: 'roles', label: 'Vai trò & quyền hạn', icon: Key },
    ],
  },
  {
    group: 'Vận hành hệ thống',
    items: [
      { id: 'integrations', label: 'Dịch vụ tích hợp', icon: Stack },
      { id: 'audit', label: 'Nhật ký hoạt động', icon: Activity },
      { id: 'backup', label: 'Bảo mật & sao lưu', icon: Database },
    ],
  },
];

const procedures = [
  { code: '1.001193', name: 'Đăng ký khai sinh', field: 'Hộ tịch', updated: '16/09/2026', status: 'Đang áp dụng' },
  { code: '2.000815', name: 'Chứng thực bản sao từ bản chính', field: 'Chứng thực', updated: '14/09/2026', status: 'Đang áp dụng' },
  { code: '1.000894', name: 'Đăng ký kết hôn', field: 'Hộ tịch', updated: '10/09/2026', status: 'Đang áp dụng' },
  { code: '2.001123', name: 'Xác nhận tình trạng hôn nhân', field: 'Hộ tịch', updated: '08/09/2026', status: 'Bản nháp' },
];

const users = [
  { name: 'Nguyễn Minh Anh', email: 'minhanh@wardmate.vn', role: 'Quản trị hệ thống', unit: 'UBND Phường An Khánh', status: 'Hoạt động' },
  { name: 'Trần Quốc Bảo', email: 'quocbao@wardmate.vn', role: 'Quản lý thủ tục', unit: 'UBND Phường An Khánh', status: 'Hoạt động' },
  { name: 'Lê Thu Hà', email: 'thuha@wardmate.vn', role: 'Cán bộ Một cửa', unit: 'Bộ phận Một cửa', status: 'Hoạt động' },
  { name: 'Phạm Văn Nam', email: 'vannam@wardmate.vn', role: 'Cán bộ Một cửa', unit: 'Bộ phận Một cửa', status: 'Tạm khóa' },
];

const auditLogs = [
  { time: '17/09/2026 · 09:42', actor: 'Trần Quốc Bảo', action: 'Cập nhật thủ tục', target: 'Đăng ký khai sinh', ip: '10.10.24.18' },
  { time: '17/09/2026 · 09:15', actor: 'Nguyễn Minh Anh', action: 'Thay đổi vai trò', target: 'Lê Thu Hà', ip: '10.10.24.06' },
  { time: '17/09/2026 · 08:30', actor: 'Hệ thống', action: 'Đồng bộ tri thức RAG', target: 'Nghị định 104/2022', ip: 'Internal' },
  { time: '16/09/2026 · 23:00', actor: 'Hệ thống', action: 'Sao lưu định kỳ', target: 'wardmate-prod', ip: 'Internal' },
];

const services = [
  { name: 'AI Assistant / RAG', status: 'Hoạt động', meta: 'Phản hồi 1,2 giây' },
  { name: 'OCR nhận dạng giấy tờ', status: 'Hoạt động', meta: 'Độ chính xác 97,8%' },
  { name: 'Kết xuất PDF & QR', status: 'Hoạt động', meta: '1.248 lượt tháng này' },
  { name: 'SMS Gateway', status: 'Cảnh báo', meta: '12 tin đang chờ' },
];

const roles = [
  { name: 'Quản trị hệ thống', users: 3, permissions: 'Toàn quyền', tone: 'danger' },
  { name: 'Quản lý thủ tục', users: 8, permissions: '18 quyền', tone: 'info' },
  { name: 'Cán bộ Một cửa', users: 24, permissions: '12 quyền', tone: 'success' },
  { name: 'Quản lý báo cáo', users: 5, permissions: '6 quyền', tone: 'warning' },
];

type ChartRange = 'day' | 'week' | 'month' | 'year';

const chartData: Record<ChartRange, Array<{ label: string; searches: number; applications: number }>> = {
  day: [
    { label: '00:00', searches: 18, applications: 4 }, { label: '04:00', searches: 12, applications: 2 },
    { label: '08:00', searches: 88, applications: 24 }, { label: '12:00', searches: 112, applications: 38 },
    { label: '16:00', searches: 96, applications: 31 }, { label: '20:00', searches: 54, applications: 17 },
    { label: '23:59', searches: 25, applications: 7 },
  ],
  week: [
    { label: 'T2', searches: 214, applications: 52 }, { label: 'T3', searches: 286, applications: 76 },
    { label: 'T4', searches: 248, applications: 64 }, { label: 'T5', searches: 318, applications: 88 },
    { label: 'T6', searches: 292, applications: 72 }, { label: 'T7', searches: 168, applications: 40 },
    { label: 'CN', searches: 124, applications: 28 },
  ],
  month: [
    { label: 'Tuần 1', searches: 920, applications: 214 }, { label: 'Tuần 2', searches: 1080, applications: 268 },
    { label: 'Tuần 3', searches: 1260, applications: 306 }, { label: 'Tuần 4', searches: 1140, applications: 284 },
    { label: 'Tuần 5', searches: 680, applications: 172 },
  ],
  year: [
    { label: 'T1', searches: 3180, applications: 742 }, { label: 'T2', searches: 3460, applications: 816 },
    { label: 'T3', searches: 3920, applications: 948 }, { label: 'T4', searches: 4210, applications: 1034 },
    { label: 'T5', searches: 4080, applications: 998 }, { label: 'T6', searches: 4560, applications: 1128 },
    { label: 'T7', searches: 4380, applications: 1062 }, { label: 'T8', searches: 4720, applications: 1184 },
    { label: 'T9', searches: 3620, applications: 884 }, { label: 'T10', searches: 0, applications: 0 },
    { label: 'T11', searches: 0, applications: 0 }, { label: 'T12', searches: 0, applications: 0 },
  ],
};

export interface AdminProfileItem {
  fullName: string;
  identityNumber: string;
  phoneNumber: string;
  dateOfBirth: string;
  gender: string;
  permanentAddress: string;
  temporaryAddress: string;
}

const initialAdminProfiles: AdminProfileItem[] = [
  {
    fullName: 'Nguyễn Minh Anh',
    identityNumber: '001092008128',
    phoneNumber: '0900000128',
    dateOfBirth: '1992-08-15',
    gender: 'Nữ',
    permanentAddress: 'Số 12 ngách 4/8 Phường An Khánh, Thành phố Hà Nội',
    temporaryAddress: 'Số 12 ngách 4/8 Phường An Khánh, Thành phố Hà Nội',
  },
  {
    fullName: 'Trần Quốc Bảo',
    identityNumber: '001088002341',
    phoneNumber: '0912345678',
    dateOfBirth: '1988-03-24',
    gender: 'Nam',
    permanentAddress: 'Số 45 Đường Giải Phóng, Phường An Khánh, Thành phố Hà Nội',
    temporaryAddress: 'Số 45 Đường Giải Phóng, Phường An Khánh, Thành phố Hà Nội',
  },
  {
    fullName: 'Lê Thu Hà',
    identityNumber: '001195009876',
    phoneNumber: '0987654321',
    dateOfBirth: '1995-11-10',
    gender: 'Nữ',
    permanentAddress: 'Thôn Thượng, Xã Ninh Hiệp, Huyện Gia Lâm, Thành phố Hà Nội',
    temporaryAddress: 'Căn hộ 802 Tòa Landmark, Phường An Khánh, Thành phố Hà Nội',
  },
  {
    fullName: 'Phạm Văn Nam',
    identityNumber: '001085001122',
    phoneNumber: '0933221100',
    dateOfBirth: '1985-05-18',
    gender: 'Nam',
    permanentAddress: 'Tổ dân phố 6, Phường An Khánh, Thành phố Hà Nội',
    temporaryAddress: 'Tổ dân phố 6, Phường An Khánh, Thành phố Hà Nội',
  },
  {
    fullName: 'Hoàng Thị Mai',
    identityNumber: '001199003344',
    phoneNumber: '0944556677',
    dateOfBirth: '1999-09-02',
    gender: 'Nữ',
    permanentAddress: 'Số 88 Ngõ 192 Lê Trọng Tấn, Thành phố Hà Nội',
    temporaryAddress: 'Số 14 Ngõ 32 Phường An Khánh, Thành phố Hà Nội',
  },
];

const sectionMeta: Record<SectionId, { title: string }> = {
  overview: { title: 'Trung tâm quản trị' },
  procedures: { title: 'Quản lý thủ tục hành chính' },
  forms: { title: 'Biểu mẫu & E-form' },
  knowledge: { title: 'Pháp lý & tri thức AI' },
  users: { title: 'Người dùng hệ thống' },
  profiles: { title: 'Quản lý hồ sơ công dân (Admin Profiles)' },
  roles: { title: 'Vai trò & quyền hạn' },
  integrations: { title: 'Dịch vụ tích hợp' },
  audit: { title: 'Nhật ký hoạt động' },
  backup: { title: 'Bảo mật & sao lưu' },
};

export function AdminPage() {
  const [activeSection, setActiveSection] = useState<SectionId>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [query, setQuery] = useState('');
  const meta = sectionMeta[activeSection];

  // Quản lý hồ sơ công dân (Admin Profiles)
  const [profiles, setProfiles] = useState<AdminProfileItem[]>(initialAdminProfiles);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<AdminProfileItem | null>(null);

  const filteredProcedures = useMemo(() => procedures.filter((item) => `${item.code} ${item.name} ${item.field}`.toLowerCase().includes(query.toLowerCase())), [query]);
  const filteredUsers = useMemo(() => users.filter((item) => `${item.name} ${item.email} ${item.role}`.toLowerCase().includes(query.toLowerCase())), [query]);

  function selectSection(id: SectionId) {
    setActiveSection(id);
    setQuery('');
    setSidebarOpen(false);
  }

  function demoAction(message: string) {
    toast.success(message);
  }

  function handleOpenCreateProfile() {
    setEditingProfile(null);
    setIsProfileModalOpen(true);
  }

  function handleSaveProfile(item: AdminProfileItem) {
    setProfiles((prev) => {
      const idx = prev.findIndex((p) => p.identityNumber === item.identityNumber);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = item;
        return next;
      }
      return [item, ...prev];
    });
    setIsProfileModalOpen(false);
    toast.success(`Đã lưu hồ sơ của công dân ${item.fullName}.`);
  }

  return (
    <div className="admin-layout">
      <a href="#admin-main" className="skip-link">Đến nội dung chính</a>
      {sidebarOpen && <button className="admin-sidebar-overlay" type="button" aria-label="Đóng menu quản trị" onClick={() => setSidebarOpen(false)} />}

      <aside id="admin-sidebar" className={`admin-sidebar ${sidebarOpen ? 'is-open' : ''} ${sidebarCollapsed ? 'is-compact' : ''}`} aria-label="Điều hướng quản trị">
        <div className="admin-brand">
          <BrandMark className="admin-brand-mark" size={42} />
          <div><BrandWordmark subtitle="Quản trị hệ thống" compact /></div>
          <button type="button" onClick={() => setSidebarOpen(false)} aria-label="Đóng menu"><X size={21} /></button>
        </div>
        <nav className="admin-nav">
          {navigation.map((group) => (
            <div className="admin-nav-section" key={group.group}>
              <p>{group.group}</p>
              {group.items.map(({ id, label, icon: Icon, badge }) => (
                <button key={id} type="button" className={activeSection === id ? 'is-active' : ''} aria-current={activeSection === id ? 'page' : undefined} onClick={() => selectSection(id)} title={sidebarCollapsed ? label : undefined}>
                  <Icon size={20} aria-hidden="true" />
                  <span>{label}</span>
                  {badge && <small>{badge}</small>}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div className="admin-sidebar-user">
          <span>QT</span>
          <div><strong>Quản trị viên</strong><small>admin@wardmate.vn</small></div>
        </div>
      </aside>

      <div className={`admin-workspace ${sidebarCollapsed ? 'is-sidebar-collapsed' : ''}`}>
        <header className="admin-topbar">
          <button type="button" className="admin-menu-toggle" aria-label="Mở menu quản trị" aria-expanded={sidebarOpen} onClick={() => setSidebarOpen(true)}><List size={23} /></button>
          <button type="button" className={`admin-collapse-button ${sidebarCollapsed ? 'is-collapsed' : ''}`} aria-label={sidebarCollapsed ? 'Mở rộng thanh điều hướng' : 'Thu gọn thanh điều hướng'} aria-controls="admin-sidebar" aria-expanded={!sidebarCollapsed} onClick={() => setSidebarCollapsed((current) => !current)}><SidebarSimple size={21} /></button>
          <div className="admin-topbar-actions">
            <button type="button" aria-label="Thông báo" onClick={() => toast.info('Bạn có 3 thông báo quản trị mới.')}><Bell size={21} /><span>3</span></button>
            <button type="button" className="admin-user-button" onClick={() => toast.info('Tài khoản quản trị hệ thống')}><span>QT</span><div><strong>Quản trị viên</strong><small>System Administrator</small></div><CaretDown size={15} /></button>
          </div>
        </header>

        <main id="admin-main" className="admin-main" tabIndex={-1}>
          <div className="admin-page-heading">
            <div><h1>{meta.title}</h1></div>
            {activeSection !== 'overview' && (
              <button
                className="admin-primary-action"
                type="button"
                onClick={() => {
                  if (activeSection === 'profiles') {
                    handleOpenCreateProfile();
                  } else {
                    demoAction('Đã mở biểu mẫu tạo mới.');
                  }
                }}
              >
                <Plus size={18} weight="bold" /> Tạo mới
              </button>
            )}
          </div>

          {activeSection === 'overview' && <Overview onSelect={selectSection} />}
          {activeSection === 'procedures' && <ProcedureView query={query} setQuery={setQuery} rows={filteredProcedures} onAction={demoAction} />}
          {activeSection === 'forms' && <FormsView onAction={demoAction} />}
          {activeSection === 'knowledge' && <KnowledgeView onAction={demoAction} />}
          {activeSection === 'users' && <UsersView query={query} setQuery={setQuery} rows={filteredUsers} onAction={demoAction} />}
          {activeSection === 'profiles' && (
            <AdminProfilesView
              query={query}
              setQuery={setQuery}
              profiles={profiles}
              onEditProfile={(item) => {
                setEditingProfile(item);
                setIsProfileModalOpen(true);
              }}
              onCreateProfile={handleOpenCreateProfile}
            />
          )}
          {activeSection === 'roles' && <RolesView onAction={demoAction} />}
          {activeSection === 'integrations' && <IntegrationsView onAction={demoAction} />}
          {activeSection === 'audit' && <AuditView />}
          {activeSection === 'backup' && <BackupView onAction={demoAction} />}
        </main>
      </div>

      {/* Modal Quản lý hồ sơ công dân */}
      <AdminProfileModal
        open={isProfileModalOpen}
        onOpenChange={setIsProfileModalOpen}
        profile={editingProfile}
        onSave={handleSaveProfile}
      />
    </div>
  );
}

function Overview({ onSelect }: { onSelect: (id: SectionId) => void }) {
  const stats = [
    { label: 'Thủ tục đang áp dụng', value: '126', icon: ClipboardText, tone: 'info' },
    { label: 'Tài khoản nội bộ', value: '40', icon: Users, tone: 'success' },
    { label: 'Nguồn tri thức AI', value: '284', icon: Robot, tone: 'warning' },
    { label: 'Cảnh báo hệ thống', value: '02', icon: ShieldCheck, tone: 'danger' },
  ];
  const shortcuts: Array<{ id: SectionId; title: string; icon: typeof House }> = [
    { id: 'procedures', title: 'Thủ tục hành chính', icon: ClipboardText },
    { id: 'forms', title: 'Biểu mẫu & E-form', icon: FileCode },
    { id: 'knowledge', title: 'Tri thức AI', icon: Books },
    { id: 'users', title: 'Người dùng', icon: Users },
    { id: 'roles', title: 'Phân quyền', icon: Key },
    { id: 'integrations', title: 'Tích hợp', icon: Stack },
  ];
  return <>
    <section className="admin-stat-grid" aria-label="Chỉ số tổng quan">
      {stats.map(({ label, value, icon: Icon, tone }) => <article key={label} className={`admin-stat-card is-${tone}`}><div><span><Icon size={24} weight="duotone" /></span><small>{label}</small></div><strong>{value}</strong></article>)}
    </section>
    <UsageChart />
    <section className="admin-card admin-module-card">
      <div className="admin-card-heading"><div><h2>Phân hệ quản trị</h2></div></div>
      <div className="admin-module-grid">{shortcuts.map(({ id, title, icon: Icon }) => <button key={id} type="button" onClick={() => onSelect(id)}><span><Icon size={22} weight="duotone" /></span><div><strong>{title}</strong></div><CaretDown size={16} /></button>)}</div>
    </section>
    <section className="admin-insight-grid">
      <article className="admin-card"><div className="admin-card-heading"><div><h2>Hoạt động quản trị gần đây</h2></div><button type="button" onClick={() => onSelect('audit')}>Xem nhật ký</button></div><div className="admin-activity-list">{auditLogs.slice(0, 3).map((log) => <div key={log.time}><span>{log.actor.slice(0, 1)}</span><p><strong>{log.actor}</strong> {log.action.toLowerCase()} <b>{log.target}</b><small>{log.time}</small></p></div>)}</div></article>
      <article className="admin-card"><div className="admin-card-heading"><div><h2>Tình trạng dịch vụ</h2></div></div><div className="admin-health-list">{services.map((service) => <div key={service.name}><span className={service.status === 'Hoạt động' ? 'is-online' : 'is-warning'} /><p>{service.name}</p><strong>{service.status}</strong></div>)}</div></article>
    </section>
  </>;
}

function UsageChart() {
  const [range, setRange] = useState<ChartRange>('week');
  const data = chartData[range];
  const totalSearches = data.reduce((total, item) => total + item.searches, 0);
  const totalApplications = data.reduce((total, item) => total + item.applications, 0);
  const rangeLabels: Array<{ id: ChartRange; label: string }> = [
    { id: 'day', label: 'Ngày' }, { id: 'week', label: 'Tuần' },
    { id: 'month', label: 'Tháng' }, { id: 'year', label: 'Năm' },
  ];

  return <section className="admin-card admin-chart-card" aria-labelledby="usage-chart-title">
    <div className="admin-chart-heading">
      <div><h2 id="usage-chart-title">Xu hướng sử dụng hệ thống</h2></div>
      <div className="admin-chart-filters" aria-label="Khoảng thời gian">
        {rangeLabels.map((item) => <button key={item.id} type="button" className={range === item.id ? 'is-active' : ''} aria-pressed={range === item.id} onClick={() => setRange(item.id)}>{item.label}</button>)}
      </div>
    </div>
    <div className="admin-chart-summary">
      <div><span className="is-search" /><p><small>Lượt tra cứu</small><strong>{totalSearches.toLocaleString('vi-VN')}</strong></p></div>
      <div><span className="is-application" /><p><small>Hồ sơ được tạo</small><strong>{totalApplications.toLocaleString('vi-VN')}</strong></p></div>
    </div>
    <div className="admin-chart-canvas" role="img" aria-label={`Biểu đồ ${totalSearches.toLocaleString('vi-VN')} lượt tra cứu và ${totalApplications.toLocaleString('vi-VN')} hồ sơ được tạo theo ${rangeLabels.find((item) => item.id === range)?.label.toLowerCase()}`}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 12, right: 8, left: -16, bottom: 0 }} accessibilityLayer>
          <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="4 4" />
          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} dy={10} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} width={52} />
          <Tooltip cursor={{ stroke: '#cbd5e1', strokeDasharray: '4 4' }} contentStyle={{ border: '1px solid #e2e8f0', borderRadius: 12, boxShadow: '0 12px 30px rgba(15,23,42,.10)', fontSize: 12 }} labelStyle={{ color: '#0f172a', fontWeight: 700, marginBottom: 6 }} formatter={(value, name) => [Number(value).toLocaleString('vi-VN'), name === 'searches' ? 'Lượt tra cứu' : 'Hồ sơ được tạo']} />
          <Area type="monotone" dataKey="searches" stroke="#991d18" strokeWidth={2.5} fill="#991d18" fillOpacity={0.08} activeDot={{ r: 5, strokeWidth: 3, stroke: '#fff', fill: '#991d18' }} />
          <Area type="monotone" dataKey="applications" stroke="#c89000" strokeWidth={2.5} fill="#ffcd00" fillOpacity={0.07} activeDot={{ r: 5, strokeWidth: 3, stroke: '#fff', fill: '#c89000' }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </section>;
}

function SearchBar({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return <label className="admin-search"><MagnifyingGlass size={18} /><span className="sr-only">Tìm kiếm</span><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} /></label>;
}

function ProcedureView({ query, setQuery, rows, onAction }: { query: string; setQuery: (value: string) => void; rows: typeof procedures; onAction: (message: string) => void }) {
  return <section className="admin-card admin-table-card admin-content-card"><div className="admin-toolbar"><SearchBar value={query} onChange={setQuery} placeholder="Tìm theo mã, tên hoặc lĩnh vực..." /><button type="button"><Gear size={17} /> Bộ lọc</button></div><div className="admin-table-wrap"><table><thead><tr><th>Mã thủ tục</th><th>Tên thủ tục</th><th>Lĩnh vực</th><th>Cập nhật</th><th>Trạng thái</th><th /></tr></thead><tbody>{rows.map((item) => <tr key={item.code}><td><strong>{item.code}</strong></td><td>{item.name}</td><td>{item.field}</td><td>{item.updated}</td><td><span className={`admin-status-badge ${item.status === 'Đang áp dụng' ? 'is-success' : 'is-warning'}`}>{item.status}</span></td><td><button type="button" onClick={() => onAction(`Đang mở ${item.name}`)}>Chỉnh sửa</button></td></tr>)}</tbody></table></div>{rows.length === 0 && <p className="admin-empty">Không tìm thấy thủ tục phù hợp.</p>}</section>;
}

function FormsView({ onAction }: { onAction: (message: string) => void }) {
  const forms = [{ name: 'Tờ khai đăng ký khai sinh', version: 'v3.2', fields: 18, linked: '4 thủ tục' }, { name: 'Tờ khai đăng ký kết hôn', version: 'v2.1', fields: 24, linked: '2 thủ tục' }, { name: 'Giấy đề nghị chứng thực', version: 'v1.8', fields: 12, linked: '6 thủ tục' }];
  return <section className="admin-card admin-content-card"><div className="admin-card-heading"><div><h2>Kho biểu mẫu</h2></div><button type="button" onClick={() => onAction('Đã mở trình thiết kế E-form.')}><FileCode size={17} /> Trình thiết kế</button></div><div className="admin-resource-grid">{forms.map((form) => <article key={form.name}><span><FileText size={24} /></span><div><strong>{form.name}</strong><small>{form.version} · {form.fields} trường dữ liệu · {form.linked}</small></div><button type="button" onClick={() => onAction(`Đang mở ${form.name}`)}>Cấu hình</button></article>)}</div></section>;
}

function KnowledgeView({ onAction }: { onAction: (message: string) => void }) {
  const docs = [{ name: 'Nghị định 104/2022/NĐ-CP', type: 'Nghị định', sync: 'Đã đồng bộ', date: '15/09/2026' }, { name: 'Thông tư 01/2022/TT-BTP', type: 'Thông tư', sync: 'Đã đồng bộ', date: '12/09/2026' }, { name: 'Quy trình hộ tịch cấp xã', type: 'Hướng dẫn', sync: 'Chờ đồng bộ', date: '17/09/2026' }];
  return <div className="admin-split-view"><section className="admin-card"><div className="admin-card-heading"><div><h2>Văn bản và nguồn tham chiếu</h2></div><button type="button" onClick={() => onAction('Đã mở vùng tải tài liệu.')}><CloudArrowUp size={17} /> Tải lên</button></div><div className="admin-resource-grid is-list">{docs.map((doc) => <article key={doc.name}><span><FileText size={23} /></span><div><strong>{doc.name}</strong><small>{doc.type} · Cập nhật {doc.date}</small></div><em className={doc.sync === 'Đã đồng bộ' ? 'is-success' : 'is-warning'}>{doc.sync}</em></article>)}</div></section><aside className="admin-card admin-sync-panel"><span><Robot size={30} weight="duotone" /></span><h2>Đồng bộ RAG</h2><strong>281 / 284 tài liệu</strong><div><i style={{ width: '89%' }} /></div><button type="button" onClick={() => onAction('Đã bắt đầu đồng bộ tri thức AI.')}>Đồng bộ ngay</button></aside></div>;
}

function UsersView({ query, setQuery, rows, onAction }: { query: string; setQuery: (value: string) => void; rows: typeof users; onAction: (message: string) => void }) {
  return <section className="admin-card admin-table-card admin-content-card"><div className="admin-toolbar"><SearchBar value={query} onChange={setQuery} placeholder="Tìm tên, email hoặc vai trò..." /><button type="button"><Gear size={17} /> Bộ lọc</button></div><div className="admin-table-wrap"><table><thead><tr><th>Người dùng</th><th>Vai trò</th><th>Đơn vị</th><th>Trạng thái</th><th /></tr></thead><tbody>{rows.map((item) => <tr key={item.email}><td><div className="admin-person"><span>{item.name.split(' ').slice(-2).map((part) => part[0]).join('')}</span><p><strong>{item.name}</strong><small>{item.email}</small></p></div></td><td>{item.role}</td><td>{item.unit}</td><td><span className={`admin-status-badge ${item.status === 'Hoạt động' ? 'is-success' : 'is-warning'}`}>{item.status}</span></td><td><button type="button" onClick={() => onAction(`Đang mở tài khoản ${item.name}`)}>Quản lý</button></td></tr>)}</tbody></table></div>{rows.length === 0 && <p className="admin-empty">Không tìm thấy tài khoản phù hợp.</p>}</section>;
}

function RolesView({ onAction }: { onAction: (message: string) => void }) {
  return <div className="admin-role-grid">{roles.map((role) => <article className="admin-card" key={role.name}><div><span className={`is-${role.tone}`}><Key size={22} /></span><button type="button" onClick={() => onAction(`Đang mở vai trò ${role.name}`)}>Chỉnh sửa</button></div><h2>{role.name}</h2><footer><Users size={17} /><strong>{role.users}</strong><span>người dùng</span><ShieldCheck size={17} /><strong>{role.permissions}</strong></footer></article>)}</div>;
}

function IntegrationsView({ onAction }: { onAction: (message: string) => void }) {
  return <div className="admin-service-grid">{services.map((service) => <article className="admin-card" key={service.name}><header><span className={service.status === 'Hoạt động' ? 'is-online' : 'is-warning'} />{service.status}</header><div><Gear size={28} weight="duotone" /><h2>{service.name}</h2></div><footer><span>{service.meta}</span><button type="button" onClick={() => onAction(`Đang mở cấu hình ${service.name}`)}>Cấu hình</button></footer></article>)}</div>;
}

function AuditView() {
  return <section className="admin-card admin-table-card admin-content-card"><div className="admin-toolbar"><SearchBar value="" onChange={() => undefined} placeholder="Tìm người thực hiện, thao tác..." /><button type="button"><Gear size={17} /> 17/09/2026</button></div><div className="admin-table-wrap"><table><thead><tr><th>Thời gian</th><th>Người thực hiện</th><th>Hành động</th><th>Đối tượng</th><th>Địa chỉ IP</th></tr></thead><tbody>{auditLogs.map((log) => <tr key={log.time}><td>{log.time}</td><td><strong>{log.actor}</strong></td><td>{log.action}</td><td>{log.target}</td><td><code>{log.ip}</code></td></tr>)}</tbody></table></div></section>;
}

function BackupView({ onAction }: { onAction: (message: string) => void }) {
  return <div className="admin-split-view"><section className="admin-card admin-security-card"><div className="admin-card-heading"><div><h2>Bảo vệ dữ liệu cá nhân</h2></div><span className="admin-status-badge is-success">Đạt yêu cầu</span></div><div className="admin-security-list"><div><ShieldCheck size={22} /><p><strong>Mã hóa dữ liệu lưu trữ</strong><small>AES-256 · Hoạt động</small></p></div><div><Key size={22} /><p><strong>Mã hóa dữ liệu truyền tải</strong><small>TLS 1.3 · Hoạt động</small></p></div><div><Activity size={22} /><p><strong>Kiểm tra truy cập bất thường</strong><small>Không phát hiện rủi ro</small></p></div></div></section><section className="admin-card admin-backup-card"><div className="admin-card-heading"><div><h2>Sao lưu gần nhất</h2></div></div><div><span><Database size={30} weight="duotone" /></span><strong>wardmate-prod-2026-09-16</strong><p>Hoàn tất lúc 23:18 · 18,4 GB · Đã mã hóa</p><div><i /></div><small>Lưu giữ 30 ngày · Bản sao tiếp theo sau 13 giờ</small><button type="button" onClick={() => onAction('Đã bắt đầu tạo bản sao lưu thủ công.')}>Sao lưu ngay</button></div></section></div>;
}

function AdminProfilesView({
  query,
  setQuery,
  profiles,
  onEditProfile,
  onCreateProfile,
}: {
  query: string;
  setQuery: (val: string) => void;
  profiles: AdminProfileItem[];
  onEditProfile: (profile: AdminProfileItem) => void;
  onCreateProfile: () => void;
}) {
  const [selectedGender, setSelectedGender] = useState('all');

  const filtered = useMemo(() => {
    return profiles.filter((p) => {
      const matchQuery = `${p.fullName} ${p.identityNumber} ${p.phoneNumber} ${p.permanentAddress} ${p.temporaryAddress}`
        .toLowerCase()
        .includes(query.toLowerCase());
      const matchGender = selectedGender === 'all' || p.gender === selectedGender;
      return matchQuery && matchGender;
    });
  }, [profiles, query, selectedGender]);

  function formatDate(d: string) {
    if (!d || !d.includes('-')) return d;
    const [y, m, day] = d.split('-');
    return `${day}/${m}/${y}`;
  }

  return (
    <section className="admin-card admin-table-card admin-content-card">
      <div className="admin-toolbar">
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Tìm tên, số CCCD, điện thoại hoặc địa chỉ..."
        />
        <div className="flex items-center gap-2">
          <select
            className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none hover:border-slate-300"
            value={selectedGender}
            onChange={(e) => setSelectedGender(e.target.value)}
          >
            <option value="all">Tất cả giới tính</option>
            <option value="Nam">Nam</option>
            <option value="Nữ">Nữ</option>
          </select>
          <button type="button" onClick={onCreateProfile}>
            <Plus size={16} weight="bold" /> Thêm hồ sơ
          </button>
        </div>
      </div>

      <div className="admin-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Họ và tên</th>
              <th>Số CCCD / Mã định danh</th>
              <th>Số điện thoại</th>
              <th>Ngày sinh</th>
              <th>Giới tính</th>
              <th>Nơi thường trú</th>
              <th>Nơi tạm trú</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.identityNumber}>
                <td>
                  <div className="admin-person">
                    <span>
                      {item.fullName
                        .split(' ')
                        .slice(-2)
                        .map((part) => part[0])
                        .join('')}
                    </span>
                    <p>
                      <strong>{item.fullName}</strong>
                      <small>Công dân</small>
                    </p>
                  </div>
                </td>
                <td>
                  <code className="rounded bg-slate-100 px-2 py-1 font-mono text-xs font-bold text-slate-900">
                    {item.identityNumber}
                  </code>
                </td>
                <td>{item.phoneNumber}</td>
                <td>{formatDate(item.dateOfBirth)}</td>
                <td>
                  <span
                    className={`admin-status-badge ${
                      item.gender === 'Nam' ? 'is-info' : 'is-warning'
                    }`}
                  >
                    {item.gender}
                  </span>
                </td>
                <td className="max-w-[200px] truncate" title={item.permanentAddress}>
                  {item.permanentAddress}
                </td>
                <td className="max-w-[200px] truncate" title={item.temporaryAddress}>
                  {item.temporaryAddress}
                </td>
                <td>
                  <button type="button" onClick={() => onEditProfile(item)}>
                    Chỉnh sửa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <p className="admin-empty">Không tìm thấy hồ sơ công dân nào phù hợp.</p>
      )}
    </section>
  );
}

function AdminProfileModal({
  open,
  onOpenChange,
  profile,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: AdminProfileItem | null;
  onSave: (item: AdminProfileItem) => void;
}) {
  const [formData, setFormData] = useState<AdminProfileItem>({
    fullName: profile?.fullName || '',
    identityNumber: profile?.identityNumber || '',
    phoneNumber: profile?.phoneNumber || '',
    dateOfBirth: profile?.dateOfBirth || '1995-01-01',
    gender: profile?.gender || 'Nam',
    permanentAddress: profile?.permanentAddress || '',
    temporaryAddress: profile?.temporaryAddress || '',
  });

  useMemo(() => {
    if (profile) {
      setFormData(profile);
    } else {
      setFormData({
        fullName: '',
        identityNumber: '',
        phoneNumber: '',
        dateOfBirth: '1995-01-01',
        gender: 'Nam',
        permanentAddress: '',
        temporaryAddress: '',
      });
    }
  }, [profile]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      toast.error('Vui lòng nhập họ và tên công dân');
      return;
    }
    if (!formData.identityNumber.trim()) {
      toast.error('Vui lòng nhập số CCCD / Mã định danh');
      return;
    }
    if (!formData.phoneNumber.trim()) {
      toast.error('Vui lòng nhập số điện thoại');
      return;
    }
    onSave(formData);
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={profile ? `Chỉnh sửa hồ sơ: ${profile.fullName}` : 'Thêm hồ sơ công dân mới'}
      description="Quản lý chi tiết các thuộc tính định danh cá nhân công dân phục vụ tiền kiểm dịch vụ công."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold text-slate-700">
              Họ và tên <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="Ví dụ: Nguyễn Minh Anh"
              className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-900 outline-none focus:border-red-400 focus:bg-white focus:ring-2 focus:ring-red-100"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700">
              Số CCCD / Mã định danh <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.identityNumber}
              onChange={(e) => setFormData({ ...formData, identityNumber: e.target.value })}
              placeholder="12 chữ số căn cước"
              className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 font-mono text-xs font-semibold text-slate-900 outline-none focus:border-red-400 focus:bg-white focus:ring-2 focus:ring-red-100"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700">
              Số điện thoại <span className="text-red-600">*</span>
            </label>
            <input
              type="tel"
              required
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              placeholder="090 000 0128"
              className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-900 outline-none focus:border-red-400 focus:bg-white focus:ring-2 focus:ring-red-100"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700">Ngày sinh</label>
            <input
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
              className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-900 outline-none focus:border-red-400 focus:bg-white focus:ring-2 focus:ring-red-100"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700">Giới tính</label>
            <select
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-900 outline-none focus:border-red-400 focus:bg-white focus:ring-2 focus:ring-red-100"
            >
              <option value="Nam">Nam</option>
              <option value="Nữ">Nữ</option>
              <option value="Khác">Khác</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700">Nơi thường trú</label>
            <input
              type="text"
              value={formData.permanentAddress}
              onChange={(e) => setFormData({ ...formData, permanentAddress: e.target.value })}
              placeholder="Địa chỉ ghi trên CCCD"
              className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-900 outline-none focus:border-red-400 focus:bg-white focus:ring-2 focus:ring-red-100"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700">Nơi tạm trú</label>
            <input
              type="text"
              value={formData.temporaryAddress}
              onChange={(e) => setFormData({ ...formData, temporaryAddress: e.target.value })}
              placeholder="Nơi ở hiện tại của công dân"
              className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-900 outline-none focus:border-red-400 focus:bg-white focus:ring-2 focus:ring-red-100"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
            onClick={() => onOpenChange(false)}
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            className="rounded-lg bg-red-800 px-5 py-2 text-xs font-bold text-white hover:bg-red-900 shadow-sm"
          >
            Lưu hồ sơ
          </button>
        </div>
      </form>
    </Modal>
  );
}
