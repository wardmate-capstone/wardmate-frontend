import { useState } from 'react';
import {
  Bell,
  CaretDown,
  ChatCenteredDots,
  ClipboardText,
  FileText,
  FilePlus,
  Gear,
  House,
  HourglassMedium,
  List,
  Question,
  SealCheck,
  SidebarSimple,
  Users,
  X,
} from '@phosphor-icons/react';
import { BrandMark } from '@/components/brand/BrandMark';
import { BrandWordmark } from '@/components/brand/BrandWordmark';
import { toast } from 'sonner';

const stats = [
  { label: 'Chờ tiền kiểm', value: '24', note: 'Hồ sơ cần xử lý', icon: HourglassMedium, tone: 'warning' },
  { label: 'Cần bổ sung', value: '08', note: 'Đã gửi góp ý', icon: FilePlus, tone: 'danger' },
  { label: 'Đã duyệt tiền kiểm', value: '42', note: 'Trong tháng này', icon: SealCheck, tone: 'success' },
  { label: 'Câu hỏi mới', value: '06', note: 'Chưa phản hồi', icon: ChatCenteredDots, tone: 'info' },
] as const;

const navItems = [
  { label: 'Tổng quan', icon: House, active: true },
  { label: 'Hồ sơ tiền kiểm', icon: ClipboardText },
  { label: 'Thủ tục hành chính', icon: FileText },
  { label: 'Người dùng', icon: Users },
  { label: 'Câu hỏi hỗ trợ', icon: Question, badge: '6' },
];

const weeklyData = [
  { day: 'T2', value: 52, label: '13 hồ sơ' },
  { day: 'T3', value: 76, label: '19 hồ sơ' },
  { day: 'T4', value: 64, label: '16 hồ sơ' },
  { day: 'T5', value: 88, label: '22 hồ sơ' },
  { day: 'T6', value: 72, label: '18 hồ sơ' },
  { day: 'T7', value: 40, label: '10 hồ sơ' },
  { day: 'CN', value: 28, label: '7 hồ sơ' },
];

const recentApplications = [
  { code: 'HS-2026-00128', procedure: 'Đăng ký khai sinh', updated: '12 phút trước', status: 'Cần bổ sung', tone: 'warning' },
  { code: 'HS-2026-00127', procedure: 'Chứng thực bản sao từ bản chính', updated: '25 phút trước', status: 'Chờ tiền kiểm', tone: 'info' },
  { code: 'HS-2026-00126', procedure: 'Đăng ký kết hôn', updated: '48 phút trước', status: 'Đã duyệt tiền kiểm', tone: 'success' },
  { code: 'HS-2026-00125', procedure: 'Xác nhận tình trạng hôn nhân', updated: '1 giờ trước', status: 'Chờ tiền kiểm', tone: 'info' },
  { code: 'HS-2026-00124', procedure: 'Đề nghị hỗ trợ xã hội', updated: '2 giờ trước', status: 'Cần bổ sung', tone: 'warning' },
] as const;

export function AdminPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  function showDemoNotice(label: string) {
    toast.info(`${label} sẽ được kết nối ở màn hình quản trị tiếp theo.`);
    setSidebarOpen(false);
  }

  return (
    <div className="admin-layout">
      <a href="#admin-main" className="skip-link">Đến nội dung chính</a>

      {sidebarOpen && <button className="admin-sidebar-overlay" type="button" aria-label="Đóng menu quản trị" onClick={() => setSidebarOpen(false)} />}
      <aside
        id="admin-sidebar"
        className={`admin-sidebar ${sidebarOpen ? 'is-open' : ''} ${sidebarCollapsed ? 'is-compact' : ''}`}
        aria-label="Điều hướng quản trị"
      >
        <div className="admin-brand">
          <BrandMark className="admin-brand-mark" size={42} />
          <div><BrandWordmark subtitle="Quản trị hệ thống" compact /></div>
          <button type="button" onClick={() => setSidebarOpen(false)} aria-label="Đóng menu"><X size={21} aria-hidden="true" /></button>
        </div>

        <nav className="admin-nav">
          <p>Menu</p>
          {navItems.map(({ label, icon: Icon, active, badge }) => (
            <button key={label} type="button" className={active ? 'is-active' : ''} aria-label={label} onClick={() => showDemoNotice(label)}>
              <Icon size={20} aria-hidden="true" />
              <span>{label}</span>
              {badge && <small>{badge}</small>}
            </button>
          ))}
          <p className="admin-nav-group">Hệ thống</p>
          <button type="button" aria-label="Cài đặt" onClick={() => showDemoNotice('Cài đặt')}><Gear size={20} aria-hidden="true" /><span>Cài đặt</span></button>
        </nav>

        <div className="admin-sidebar-user">
          <span>QT</span>
          <div><strong>Quản trị viên</strong><small>admin@wardmate.vn</small></div>
        </div>
      </aside>

      <div className={`admin-workspace ${sidebarCollapsed ? 'is-sidebar-collapsed' : ''}`}>
        <header className="admin-topbar">
          <button type="button" className="admin-menu-toggle" aria-label="Mở menu quản trị" aria-expanded={sidebarOpen} onClick={() => setSidebarOpen(true)}><List size={23} aria-hidden="true" /></button>
          <button
            type="button"
            className={`admin-collapse-button ${sidebarCollapsed ? 'is-collapsed' : ''}`}
            aria-label={sidebarCollapsed ? 'Mở rộng thanh điều hướng' : 'Thu gọn thanh điều hướng'}
            aria-controls="admin-sidebar"
            aria-expanded={!sidebarCollapsed}
            onClick={() => setSidebarCollapsed((current) => !current)}
          >
            <SidebarSimple size={21} aria-hidden="true" />
          </button>
          <div className="admin-topbar-actions">
            <button type="button" aria-label="Thông báo" onClick={() => toast.info('Bạn có 3 thông báo mới.')}><Bell size={21} aria-hidden="true" /><span>3</span></button>
            <button type="button" className="admin-user-button" onClick={() => toast.info('Menu tài khoản quản trị viên.')}>
              <span>QT</span><div><strong>Quản trị viên</strong><small>Cán bộ Một cửa</small></div><CaretDown size={15} aria-hidden="true" />
            </button>
          </div>
        </header>

        <main id="admin-main" className="admin-main" tabIndex={-1}>
          <div className="admin-page-heading">
            <div><p>Tổng quan</p><h1>Trung tâm điều hành</h1><span>Theo dõi hoạt động tiền kiểm hồ sơ.</span></div>
            <span className="admin-data-note">Dữ liệu tạm thời</span>
          </div>

          <section className="admin-stat-grid" aria-label="Chỉ số tổng quan">
            {stats.map(({ label, value, note, icon: Icon, tone }) => (
              <article key={label} className={`admin-stat-card is-${tone}`}>
                <div><span><Icon size={24} weight="duotone" aria-hidden="true" /></span><small>{label}</small></div>
                <strong>{value}</strong>
                <p>{note}</p>
              </article>
            ))}
          </section>

          <section className="admin-insight-grid">
            <article className="admin-card admin-activity-card">
              <div className="admin-card-heading"><div><h2>Hồ sơ tiếp nhận trong tuần</h2><p>Số yêu cầu tiền kiểm theo ngày</p></div><button type="button" onClick={() => toast.info('Bộ lọc thời gian sẽ được bổ sung sau.')}>7 ngày <CaretDown size={15} aria-hidden="true" /></button></div>
              <div className="admin-bar-chart" aria-label="Biểu đồ hồ sơ trong tuần">
                {weeklyData.map((item) => (
                  <div key={item.day} className="admin-bar-column"><span title={item.label} style={{ height: `${item.value}%` }} aria-label={`${item.day}: ${item.label}`} /><small>{item.day}</small></div>
                ))}
              </div>
            </article>

            <article className="admin-card admin-status-card">
              <div className="admin-card-heading"><div><h2>Trạng thái hồ sơ</h2><p>Phân bố hiện tại</p></div></div>
              <div className="admin-status-visual"><div className="admin-donut" aria-label="74 hồ sơ"><span><strong>74</strong><small>Hồ sơ</small></span></div></div>
              <ul className="admin-status-legend">
                <li><span className="is-red" /><p>Chờ tiền kiểm</p><strong>24</strong></li>
                <li><span className="is-gold" /><p>Cần bổ sung</p><strong>08</strong></li>
                <li><span className="is-green" /><p>Đã duyệt tiền kiểm</p><strong>42</strong></li>
              </ul>
            </article>
          </section>

          <section className="admin-card admin-table-card" aria-labelledby="recent-applications-title">
            <div className="admin-card-heading"><div><h2 id="recent-applications-title">Hồ sơ cập nhật gần đây</h2><p>Danh sách cần theo dõi</p></div><button type="button" onClick={() => showDemoNotice('Tất cả hồ sơ')}>Xem tất cả</button></div>
            <div className="admin-table-wrap">
              <table>
                <thead><tr><th>Mã hồ sơ</th><th>Thủ tục</th><th>Cập nhật</th><th>Trạng thái</th><th><span className="sr-only">Hành động</span></th></tr></thead>
                <tbody>
                  {recentApplications.map((item) => (
                    <tr key={item.code}>
                      <td><strong>{item.code}</strong></td><td>{item.procedure}</td><td>{item.updated}</td><td><span className={`admin-status-badge is-${item.tone}`}>{item.status}</span></td>
                      <td><button type="button" onClick={() => showDemoNotice(item.code)}>Xem</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
