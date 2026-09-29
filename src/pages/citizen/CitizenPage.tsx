import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowClockwise,
  Bell,
  CaretDown,
  CaretRight,
  CheckCircle,
  Checks,
  Clock,
  CloudArrowUp,
  DownloadSimple,
  Eye,
  FileCode,
  FileDashed,
  FilePdf,
  FileText,
  Folder,
  House,
  List,
  MagnifyingGlass,
  NotePencil,
  Plus,
  Printer,
  QrCode,
  SealCheck,
  ShieldCheck,
  SidebarSimple,
  SignOut,
  Star,
  UploadSimple,
  User,
  WarningCircle,
  X,
} from '@phosphor-icons/react';
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
import { toast } from '@/components/ui/Toast';
import { CitizenFeedbackModal } from '@/components/feedback/CitizenFeedbackModal';
import type { CitizenFeedback } from '@/types/feedback';

export type CitizenSectionId =
  | 'dashboard'
  | 'procedures'
  // Hồ sơ của tôi
  | 'dossiers_all'
  | 'dossiers_draft'
  | 'dossiers_pending'
  | 'dossiers_need_revision'
  | 'dossiers_resubmitted'
  | 'dossiers_approved'
  | 'dossiers_completed'
  // Chuẩn bị hồ sơ
  | 'prep_checklist'
  | 'prep_documents'
  | 'prep_forms'
  | 'prep_pdfs'
  // Tiện ích
  | 'notifications'
  | 'qr_code'
  | 'feedback'
  | 'profile'
  | 'logout';

// Kiểu dữ liệu hồ sơ công dân
export interface CitizenDossier {
  code: string;
  procedureName: string;
  field: string;
  createdAt: string;
  updatedAt: string;
  status:
    | 'Bản nháp'
    | 'Chờ tiền kiểm'
    | 'Cần chỉnh sửa'
    | 'Đã gửi lại'
    | 'Đã duyệt'
    | 'Đã hoàn thành';
  officerNote?: string;
  officerName?: string;
}

const initialDossiers: CitizenDossier[] = [
  {
    code: 'HS-2026-00094',
    procedureName: 'Chứng thực bản sao từ bản chính',
    field: 'Chứng thực',
    createdAt: '25/09/2026',
    updatedAt: '28/09/2026 · 08:15',
    status: 'Đã hoàn thành',
    officerName: 'Lê Thu Hà (Bộ phận Một cửa)',
    officerNote: 'Hồ sơ đối chiếu hoàn tất, công dân đã nhận kết quả.',
  },
  {
    code: 'HS-2026-00128',
    procedureName: 'Đăng ký khai sinh',
    field: 'Hộ tịch',
    createdAt: '27/09/2026',
    updatedAt: '28/09/2026 · 09:42',
    status: 'Cần chỉnh sửa',
    officerName: 'Phạm Văn Nam',
    officerNote: 'Ảnh chụp giấy chứng sinh bị mờ góc dưới, vui lòng chụp lại rõ nét.',
  },
  {
    code: 'HS-2026-00155',
    procedureName: 'Xác nhận tình trạng hôn nhân',
    field: 'Hộ tịch',
    createdAt: '28/09/2026',
    updatedAt: '28/09/2026 · 14:20',
    status: 'Đã gửi lại',
    officerName: 'Trần Quốc Bảo',
    officerNote: 'Đã nhận bản cập nhật mới, đang tiền kiểm lần 2.',
  },
  {
    code: 'HS-2026-00160',
    procedureName: 'Đăng ký kết hôn',
    field: 'Hộ tịch',
    createdAt: '27/09/2026',
    updatedAt: '27/09/2026 · 16:30',
    status: 'Chờ tiền kiểm',
    officerName: 'Đang phân công',
    officerNote: 'Hồ sơ đã vào hàng đợi tiền kiểm trực tuyến.',
  },
  {
    code: 'HS-2026-00162',
    procedureName: 'Đăng ký biến động quyền sử dụng đất',
    field: 'Địa chính',
    createdAt: '29/09/2026',
    updatedAt: '29/09/2026 · 10:15',
    status: 'Chờ tiền kiểm',
    officerName: 'Đang phân công',
    officerNote: 'Đã tải lên giấy chứng nhận và căn cước công dân.',
  },
  {
    code: 'HS-2026-00170',
    procedureName: 'Cấp trích lục hộ tịch',
    field: 'Hộ tịch',
    createdAt: '29/09/2026',
    updatedAt: '29/09/2026 · 11:30',
    status: 'Đã duyệt',
    officerName: 'Lê Thu Hà',
    officerNote: 'Hồ sơ tiền kiểm hợp lệ 100%. Vui lòng mang giấy tờ gốc đến Một cửa.',
  },
  {
    code: 'HS-DRAFT-003',
    procedureName: 'Chứng thực chữ ký trong giấy tờ',
    field: 'Chứng thực',
    createdAt: '29/09/2026',
    updatedAt: '29/09/2026 · 09:00',
    status: 'Bản nháp',
    officerNote: 'Chưa nộp tiền kiểm, đang chuẩn bị hồ sơ.',
  },
];

const citizenProcedures = [
  { code: '1.001193', name: 'Đăng ký khai sinh', field: 'Hộ tịch', duration: 'Trong ngày làm việc', fee: 'Miễn phí' },
  { code: '2.000815', name: 'Chứng thực bản sao từ bản chính', field: 'Chứng thực', duration: '0,5 ngày làm việc', fee: '2.000 VNĐ / trang' },
  { code: '1.000894', name: 'Đăng ký kết hôn', field: 'Hộ tịch', duration: 'Trong ngày làm việc', fee: 'Miễn phí' },
  { code: '2.001123', name: 'Xác nhận tình trạng hôn nhân', field: 'Hộ tịch', duration: '03 ngày làm việc', fee: '15.000 VNĐ' },
  { code: '1.000782', name: 'Đăng ký khai tử', field: 'Hộ tịch', duration: 'Trong ngày làm việc', fee: 'Miễn phí' },
  { code: '3.000214', name: 'Đăng ký biến động quyền sử dụng đất', field: 'Địa chính', duration: '10 ngày làm việc', fee: 'Theo quy định' },
  { code: '2.000451', name: 'Chứng thực chữ ký trong giấy tờ', field: 'Chứng thực', duration: '0,5 ngày làm việc', fee: '10.000 VNĐ / việc' },
];

const citizenDocuments = [
  { id: 'doc-1', name: 'CCCD_Gan_Chip_MatTruoc.jpg', type: 'Căn cước công dân (Mặt trước)', size: '1.8 MB', updatedAt: '20/09/2026', verified: true },
  { id: 'doc-2', name: 'CCCD_Gan_Chip_MatSau.jpg', type: 'Căn cước công dân (Mặt sau)', size: '2.1 MB', updatedAt: '20/09/2026', verified: true },
  { id: 'doc-3', name: 'Giay_Chung_Sinh_BaoKhang.pdf', type: 'Giấy chứng sinh', size: '3.4 MB', updatedAt: '27/09/2026', verified: false },
  { id: 'doc-4', name: 'Giay_Chung_Nhan_Doc_Than.pdf', type: 'Giấy xác nhận độc thân', size: '1.2 MB', updatedAt: '15/09/2026', verified: true },
  { id: 'doc-5', name: 'So_Ho_Khau_Dien_Tu.pdf', type: 'Xác nhận cư trú (CT07)', size: '2.7 MB', updatedAt: '10/09/2026', verified: true },
];

const citizenForms = [
  { id: 'form-1', title: 'Tờ khai đăng ký khai sinh', code: 'TK-KS-01', fields: 18, appliesTo: 'Đăng ký khai sinh' },
  { id: 'form-2', title: 'Tờ khai đăng ký kết hôn', code: 'TK-KH-02', fields: 24, appliesTo: 'Đăng ký kết hôn' },
  { id: 'form-3', title: 'Tờ khai xác nhận tình trạng hôn nhân', code: 'TK-HN-03', fields: 16, appliesTo: 'Xác nhận tình trạng hôn nhân' },
  { id: 'form-4', title: 'Giấy đề nghị chứng thực bản sao', code: 'TK-CT-04', fields: 8, appliesTo: 'Chứng thực bản sao từ bản chính' },
];

const citizenPdfs = [
  { id: 'pdf-1', title: 'Phieu_Tien_Kiem_HS-2026-00094.pdf', code: 'HS-2026-00094', procedure: 'Chứng thực bản sao từ bản chính', date: '28/09/2026', qrCode: 'WM-QR-00094' },
  { id: 'pdf-2', title: 'To_Khai_Khai_Sinh_HS-2026-00128.pdf', code: 'HS-2026-00128', procedure: 'Đăng ký khai sinh', date: '27/09/2026', qrCode: 'WM-QR-00128' },
  { id: 'pdf-3', title: 'Phieu_Hen_Tiep_Nhan_HS-2026-00170.pdf', code: 'HS-2026-00170', procedure: 'Cấp trích lục hộ tịch', date: '29/09/2026', qrCode: 'WM-QR-00170' },
];

const citizenNotifications = [
  { id: 'notif-1', title: 'Hồ sơ đã được phê duyệt tiền kiểm', content: 'Hồ sơ HS-2026-00170 đã đạt yêu cầu. Bạn có thể đến bộ phận Một cửa để đối chiếu giấy tờ gốc.', time: '10 phút trước', read: false, type: 'success' },
  { id: 'notif-2', title: 'Yêu cầu chỉnh sửa ảnh giấy chứng sinh', content: 'Hồ sơ HS-2026-00128 cần chụp lại giấy chứng sinh do bị mờ góc dưới bên phải.', time: '2 giờ trước', read: false, type: 'warning' },
  { id: 'notif-3', title: 'Cán bộ đang tiền kiểm hồ sơ', content: 'Cán bộ Trần Quốc Bảo đã tiếp nhận tiền kiểm hồ sơ HS-2026-00155.', time: 'Hôm qua · 14:20', read: true, type: 'info' },
  { id: 'notif-4', title: 'Hoàn tất trả kết quả hồ sơ', content: 'Hồ sơ HS-2026-00094 chứng thực bản sao đã hoàn tất thành công.', time: '28/09/2026', read: true, type: 'success' },
];

type ChartRange = 'day' | 'week' | 'month' | 'year';

const citizenChartData: Record<ChartRange, Array<{ label: string; views: number; dossiers: number }>> = {
  day: [
    { label: '06:00', views: 2, dossiers: 0 },
    { label: '09:00', views: 8, dossiers: 2 },
    { label: '12:00', views: 5, dossiers: 1 },
    { label: '15:00', views: 12, dossiers: 3 },
    { label: '18:00', views: 7, dossiers: 1 },
    { label: '21:00', views: 4, dossiers: 0 },
  ],
  week: [
    { label: 'T2', views: 18, dossiers: 2 },
    { label: 'T3', views: 24, dossiers: 3 },
    { label: 'T4', views: 20, dossiers: 1 },
    { label: 'T5', views: 32, dossiers: 4 },
    { label: 'T6', views: 28, dossiers: 2 },
    { label: 'T7', views: 15, dossiers: 1 },
    { label: 'CN', views: 9, dossiers: 0 },
  ],
  month: [
    { label: 'Tuần 1', views: 65, dossiers: 4 },
    { label: 'Tuần 2', views: 92, dossiers: 6 },
    { label: 'Tuần 3', views: 110, dossiers: 7 },
    { label: 'Tuần 4', views: 84, dossiers: 5 },
  ],
  year: [
    { label: 'T1', views: 120, dossiers: 8 },
    { label: 'T2', views: 140, dossiers: 10 },
    { label: 'T3', views: 180, dossiers: 12 },
    { label: 'T4', views: 160, dossiers: 9 },
    { label: 'T5', views: 210, dossiers: 15 },
    { label: 'T6', views: 230, dossiers: 16 },
    { label: 'T7', views: 195, dossiers: 11 },
    { label: 'T8', views: 240, dossiers: 18 },
    { label: 'T9', views: 220, dossiers: 14 },
    { label: 'T10', views: 0, dossiers: 0 },
    { label: 'T11', views: 0, dossiers: 0 },
    { label: 'T12', views: 0, dossiers: 0 },
  ],
};

const sectionTitles: Record<CitizenSectionId, { title: string; subtitle?: string }> = {
  dashboard: { title: 'Tổng quan công dân', subtitle: 'Theo dõi tiến độ hồ sơ & chuẩn bị dịch vụ công trực tuyến' },
  procedures: { title: 'Tra cứu thủ tục hành chính', subtitle: 'Tìm kiếm, xem quy trình và chuẩn bị hồ sơ tiền kiểm' },
  dossiers_all: { title: 'Tất cả hồ sơ của tôi', subtitle: 'Danh sách toàn bộ hồ sơ đang thực hiện và lịch sử' },
  dossiers_draft: { title: 'Hồ sơ bản nháp', subtitle: 'Các hồ sơ đang soạn thảo, chưa gửi tiền kiểm' },
  dossiers_pending: { title: 'Hồ sơ chờ tiền kiểm', subtitle: 'Hồ sơ đã gửi, đang chờ cán bộ Một cửa thẩm tra giấy tờ' },
  dossiers_need_revision: { title: 'Hồ sơ cần chỉnh sửa', subtitle: 'Hồ sơ cán bộ phản hồi cần bổ sung hoặc chụp lại giấy tờ' },
  dossiers_resubmitted: { title: 'Hồ sơ đã gửi lại', subtitle: 'Hồ sơ công dân đã hoàn thiện và gửi lại cán bộ kiểm tra' },
  dossiers_approved: { title: 'Hồ sơ đã duyệt tiền kiểm', subtitle: 'Giấy tờ hợp lệ, sẵn sàng mang bản gốc đối chiếu tại Một cửa' },
  dossiers_completed: { title: 'Hồ sơ đã hoàn thành', subtitle: 'Đã hoàn tất quy trình và nhận kết quả tại UBND phường' },
  prep_checklist: { title: 'Checklist chuẩn bị hồ sơ', subtitle: 'Danh mục giấy tờ cần chuẩn bị theo từng thủ tục' },
  prep_documents: { title: 'Giấy tờ cá nhân đã tải lên', subtitle: 'Kho tài liệu điện tử dùng chung để nộp các thủ tục' },
  prep_forms: { title: 'Biểu mẫu điện tử (E-Form)', subtitle: 'Khai trực tuyến hoặc tải mẫu đơn hành chính' },
  prep_pdfs: { title: 'PDF & Phiếu hẹn đã tạo', subtitle: 'Các bản in hồ sơ điện tử có mã QR tiền kiểm hợp lệ' },
  notifications: { title: 'Thông báo & Cập nhật', subtitle: 'Tin nhắn tiến độ hồ sơ từ cán bộ tiếp nhận' },
  qr_code: { title: 'Mã QR hồ sơ điện tử', subtitle: 'Mã đối chiếu nhanh khi đến Bộ phận Một cửa UBND phường' },
  feedback: { title: 'Đánh giá dịch vụ & Sự hài lòng', subtitle: 'Góp ý chất lượng phục vụ tiền kiểm hồ sơ hành chính' },
  profile: { title: 'Hồ sơ cá nhân & Định danh', subtitle: 'Thông tin công dân, tài khoản VNeID và liên hệ' },
  logout: { title: 'Đăng xuất', subtitle: 'Xác nhận thoát khỏi phiên làm việc' },
};

export function CitizenPage() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<CitizenSectionId>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [query, setQuery] = useState('');

  // Expandable sections in sidebar
  const [isDossiersExpanded, setIsDossiersExpanded] = useState(true);
  const [isPrepExpanded, setIsPrepExpanded] = useState(true);

  // Data states
  const [dossiers] = useState<CitizenDossier[]>(initialDossiers);
  const [notifications, setNotifications] = useState(citizenNotifications);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // Feedback modal state
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [selectedFeedbackDossier, setSelectedFeedbackDossier] = useState<{ procedure: string; code?: string }>({
    procedure: 'Chứng thực bản sao từ bản chính',
    code: 'HS-2026-00094',
  });

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  // Counts for Dossier Badges
  const dossierCounts = useMemo(() => {
    return {
      all: dossiers.length,
      draft: dossiers.filter((d) => d.status === 'Bản nháp').length,
      pending: dossiers.filter((d) => d.status === 'Chờ tiền kiểm').length,
      need_revision: dossiers.filter((d) => d.status === 'Cần chỉnh sửa').length,
      resubmitted: dossiers.filter((d) => d.status === 'Đã gửi lại').length,
      approved: dossiers.filter((d) => d.status === 'Đã duyệt').length,
      completed: dossiers.filter((d) => d.status === 'Đã hoàn thành').length,
    };
  }, [dossiers]);

  const meta = sectionTitles[activeSection] || { title: 'Cổng dịch vụ công dân' };

  function selectSection(id: CitizenSectionId) {
    if (id === 'logout') {
      setIsLogoutModalOpen(true);
      return;
    }
    setActiveSection(id);
    setQuery('');
    setSidebarOpen(false);
  }

  function handleLogoutConfirm() {
    setIsLogoutModalOpen(false);
    toast.success('Đã đăng xuất thành công khỏi hệ thống.');
    navigate('/dang-nhap');
  }

  function handleOpenFeedback(procedure: string, code?: string) {
    setSelectedFeedbackDossier({ procedure, code });
    setIsFeedbackModalOpen(true);
  }

  function handleSubmitFeedback(data: CitizenFeedback) {
    toast.success(`Cảm ơn bạn đã đánh giá dịch vụ ${data.rating} sao! Phản hồi đã được ghi nhận.`);
  }

  const isDossierSection = activeSection.startsWith('dossiers_');

  return (
    <div className="admin-layout">
      <a href="#citizen-main" className="skip-link">
        Đến nội dung chính
      </a>

      {sidebarOpen && (
        <button
          className="admin-sidebar-overlay"
          type="button"
          aria-label="Đóng menu công dân"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR GIAO DIỆN NGƯỜI DÂN */}
      <aside
        id="citizen-sidebar"
        className={`admin-sidebar ${sidebarOpen ? 'is-open' : ''} ${sidebarCollapsed ? 'is-compact' : ''}`}
        aria-label="Điều hướng công dân"
      >
        <div className="admin-brand">
          <BrandMark className="admin-brand-mark" size={40} />
          <div>
            <BrandWordmark subtitle="Dịch vụ công dân" compact />
          </div>
          <button type="button" onClick={() => setSidebarOpen(false)} aria-label="Đóng menu">
            <X size={20} />
          </button>
        </div>

        <nav className="admin-nav">
          {/* Nhóm 1: Tổng quan */}
          <div className="admin-nav-section">
            <p>Tổng quan</p>
            <button
              type="button"
              className={activeSection === 'dashboard' ? 'is-active' : ''}
              aria-current={activeSection === 'dashboard' ? 'page' : undefined}
              onClick={() => selectSection('dashboard')}
              title={sidebarCollapsed ? 'Dashboard' : undefined}
            >
              <House size={20} aria-hidden="true" weight={activeSection === 'dashboard' ? 'fill' : 'regular'} />
              <span>Dashboard</span>
            </button>
            <button
              type="button"
              className={activeSection === 'procedures' ? 'is-active' : ''}
              aria-current={activeSection === 'procedures' ? 'page' : undefined}
              onClick={() => selectSection('procedures')}
              title={sidebarCollapsed ? 'Tra cứu thủ tục' : undefined}
            >
              <MagnifyingGlass size={20} aria-hidden="true" />
              <span>Tra cứu thủ tục</span>
            </button>
          </div>

          {/* Nhóm 2: Hồ sơ của tôi */}
          <div className="admin-nav-section">
            <div className="flex items-center justify-between px-3 mb-1">
              <p className="!m-0">Hồ sơ của tôi</p>
              {!sidebarCollapsed && (
                <button
                  type="button"
                  onClick={() => setIsDossiersExpanded(!isDossiersExpanded)}
                  className="text-slate-400 hover:text-slate-700 p-0.5 rounded"
                  aria-label={isDossiersExpanded ? 'Thu gọn hồ sơ' : 'Mở rộng hồ sơ'}
                >
                  <CaretDown
                    size={14}
                    className={`transition-transform duration-200 ${isDossiersExpanded ? '' : '-rotate-90'}`}
                  />
                </button>
              )}
            </div>

            {/* Các nhánh con của Hồ sơ của tôi */}
            {(isDossiersExpanded || sidebarCollapsed) && (
              <div className="space-y-0.5">
                <button
                  type="button"
                  className={activeSection === 'dossiers_all' ? 'is-active' : ''}
                  aria-current={activeSection === 'dossiers_all' ? 'page' : undefined}
                  onClick={() => selectSection('dossiers_all')}
                  title={sidebarCollapsed ? 'Tất cả hồ sơ' : undefined}
                >
                  <Folder size={19} aria-hidden="true" weight={activeSection === 'dossiers_all' ? 'fill' : 'regular'} />
                  <span>Tất cả hồ sơ</span>
                  {dossierCounts.all > 0 && <small>{dossierCounts.all}</small>}
                </button>

                <button
                  type="button"
                  className={activeSection === 'dossiers_draft' ? 'is-active' : ''}
                  aria-current={activeSection === 'dossiers_draft' ? 'page' : undefined}
                  onClick={() => selectSection('dossiers_draft')}
                  title={sidebarCollapsed ? 'Bản nháp' : undefined}
                >
                  <FileDashed size={19} aria-hidden="true" />
                  <span>Bản nháp</span>
                  {dossierCounts.draft > 0 && <small>{dossierCounts.draft}</small>}
                </button>

                <button
                  type="button"
                  className={activeSection === 'dossiers_pending' ? 'is-active' : ''}
                  aria-current={activeSection === 'dossiers_pending' ? 'page' : undefined}
                  onClick={() => selectSection('dossiers_pending')}
                  title={sidebarCollapsed ? 'Chờ tiền kiểm' : undefined}
                >
                  <Clock size={19} aria-hidden="true" className="text-sky-600" />
                  <span>Chờ tiền kiểm</span>
                  {dossierCounts.pending > 0 && (
                    <small className="!bg-sky-100 !text-sky-800">{dossierCounts.pending}</small>
                  )}
                </button>

                <button
                  type="button"
                  className={activeSection === 'dossiers_need_revision' ? 'is-active' : ''}
                  aria-current={activeSection === 'dossiers_need_revision' ? 'page' : undefined}
                  onClick={() => selectSection('dossiers_need_revision')}
                  title={sidebarCollapsed ? 'Cần chỉnh sửa' : undefined}
                >
                  <WarningCircle size={19} aria-hidden="true" className="text-amber-600" />
                  <span>Cần chỉnh sửa</span>
                  {dossierCounts.need_revision > 0 && (
                    <small className="!bg-amber-100 !text-amber-800">{dossierCounts.need_revision}</small>
                  )}
                </button>

                <button
                  type="button"
                  className={activeSection === 'dossiers_resubmitted' ? 'is-active' : ''}
                  aria-current={activeSection === 'dossiers_resubmitted' ? 'page' : undefined}
                  onClick={() => selectSection('dossiers_resubmitted')}
                  title={sidebarCollapsed ? 'Đã gửi lại' : undefined}
                >
                  <ArrowClockwise size={19} aria-hidden="true" className="text-indigo-600" />
                  <span>Đã gửi lại</span>
                  {dossierCounts.resubmitted > 0 && (
                    <small className="!bg-indigo-100 !text-indigo-800">{dossierCounts.resubmitted}</small>
                  )}
                </button>

                <button
                  type="button"
                  className={activeSection === 'dossiers_approved' ? 'is-active' : ''}
                  aria-current={activeSection === 'dossiers_approved' ? 'page' : undefined}
                  onClick={() => selectSection('dossiers_approved')}
                  title={sidebarCollapsed ? 'Đã duyệt' : undefined}
                >
                  <CheckCircle size={19} aria-hidden="true" className="text-emerald-600" />
                  <span>Đã duyệt</span>
                  {dossierCounts.approved > 0 && (
                    <small className="!bg-emerald-100 !text-emerald-800">{dossierCounts.approved}</small>
                  )}
                </button>

                <button
                  type="button"
                  className={activeSection === 'dossiers_completed' ? 'is-active' : ''}
                  aria-current={activeSection === 'dossiers_completed' ? 'page' : undefined}
                  onClick={() => selectSection('dossiers_completed')}
                  title={sidebarCollapsed ? 'Đã hoàn thành' : undefined}
                >
                  <SealCheck size={19} aria-hidden="true" className="text-teal-600" />
                  <span>Đã hoàn thành</span>
                  {dossierCounts.completed > 0 && (
                    <small className="!bg-teal-100 !text-teal-800">{dossierCounts.completed}</small>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Nhóm 3: Chuẩn bị hồ sơ */}
          <div className="admin-nav-section">
            <div className="flex items-center justify-between px-3 mb-1">
              <p className="!m-0">Chuẩn bị hồ sơ</p>
              {!sidebarCollapsed && (
                <button
                  type="button"
                  onClick={() => setIsPrepExpanded(!isPrepExpanded)}
                  className="text-slate-400 hover:text-slate-700 p-0.5 rounded"
                  aria-label={isPrepExpanded ? 'Thu gọn chuẩn bị' : 'Mở rộng chuẩn bị'}
                >
                  <CaretDown
                    size={14}
                    className={`transition-transform duration-200 ${isPrepExpanded ? '' : '-rotate-90'}`}
                  />
                </button>
              )}
            </div>

            {(isPrepExpanded || sidebarCollapsed) && (
              <div className="space-y-0.5">
                <button
                  type="button"
                  className={activeSection === 'prep_checklist' ? 'is-active' : ''}
                  aria-current={activeSection === 'prep_checklist' ? 'page' : undefined}
                  onClick={() => selectSection('prep_checklist')}
                  title={sidebarCollapsed ? 'Checklist' : undefined}
                >
                  <Checks size={19} aria-hidden="true" />
                  <span>Checklist</span>
                </button>

                <button
                  type="button"
                  className={activeSection === 'prep_documents' ? 'is-active' : ''}
                  aria-current={activeSection === 'prep_documents' ? 'page' : undefined}
                  onClick={() => selectSection('prep_documents')}
                  title={sidebarCollapsed ? 'Giấy tờ đã tải lên' : undefined}
                >
                  <CloudArrowUp size={19} aria-hidden="true" />
                  <span>Giấy tờ đã tải lên</span>
                  <small>{citizenDocuments.length}</small>
                </button>

                <button
                  type="button"
                  className={activeSection === 'prep_forms' ? 'is-active' : ''}
                  aria-current={activeSection === 'prep_forms' ? 'page' : undefined}
                  onClick={() => selectSection('prep_forms')}
                  title={sidebarCollapsed ? 'Biểu mẫu' : undefined}
                >
                  <FileCode size={19} aria-hidden="true" />
                  <span>Biểu mẫu</span>
                  <small>{citizenForms.length}</small>
                </button>

                <button
                  type="button"
                  className={activeSection === 'prep_pdfs' ? 'is-active' : ''}
                  aria-current={activeSection === 'prep_pdfs' ? 'page' : undefined}
                  onClick={() => selectSection('prep_pdfs')}
                  title={sidebarCollapsed ? 'PDF đã tạo' : undefined}
                >
                  <FilePdf size={19} aria-hidden="true" />
                  <span>PDF đã tạo</span>
                  <small>{citizenPdfs.length}</small>
                </button>
              </div>
            )}
          </div>

          {/* Nhóm 4: Tiện ích & Tài khoản */}
          <div className="admin-nav-section">
            <p>Tiện ích & Tài khoản</p>
            <button
              type="button"
              className={activeSection === 'notifications' ? 'is-active' : ''}
              aria-current={activeSection === 'notifications' ? 'page' : undefined}
              onClick={() => selectSection('notifications')}
              title={sidebarCollapsed ? 'Thông báo' : undefined}
            >
              <Bell size={20} aria-hidden="true" />
              <span>Thông báo</span>
              {unreadNotificationsCount > 0 && <small>{unreadNotificationsCount}</small>}
            </button>

            <button
              type="button"
              className={activeSection === 'qr_code' ? 'is-active' : ''}
              aria-current={activeSection === 'qr_code' ? 'page' : undefined}
              onClick={() => selectSection('qr_code')}
              title={sidebarCollapsed ? 'Mã QR hồ sơ' : undefined}
            >
              <QrCode size={20} aria-hidden="true" />
              <span>Mã QR hồ sơ</span>
            </button>

            <button
              type="button"
              className={activeSection === 'feedback' ? 'is-active' : ''}
              aria-current={activeSection === 'feedback' ? 'page' : undefined}
              onClick={() => selectSection('feedback')}
              title={sidebarCollapsed ? 'Đánh giá dịch vụ' : undefined}
            >
              <Star size={20} aria-hidden="true" />
              <span>Đánh giá dịch vụ</span>
            </button>

            <button
              type="button"
              className={activeSection === 'profile' ? 'is-active' : ''}
              aria-current={activeSection === 'profile' ? 'page' : undefined}
              onClick={() => selectSection('profile')}
              title={sidebarCollapsed ? 'Hồ sơ cá nhân' : undefined}
            >
              <User size={20} aria-hidden="true" />
              <span>Hồ sơ cá nhân</span>
            </button>

            <button
              type="button"
              className="text-red-700 hover:!bg-red-50 hover:!text-red-800"
              onClick={() => selectSection('logout')}
              title={sidebarCollapsed ? 'Đăng xuất' : undefined}
            >
              <SignOut size={20} aria-hidden="true" />
              <span>Đăng xuất</span>
            </button>
          </div>
        </nav>

        {/* Chân Sidebar: Thông tin công dân */}
        <div className="admin-sidebar-user">
          <span className="!bg-red-800">CD</span>
          <div>
            <strong>Nguyễn Minh Anh</strong>
            <small>090 000 0128</small>
          </div>
        </div>
      </aside>

      {/* KHÔNG GIAN LÀM VIỆC CHÍNH (WORKSPACE) */}
      <div className={`admin-workspace ${sidebarCollapsed ? 'is-sidebar-collapsed' : ''}`}>
        {/* TOPBAR */}
        <header className="admin-topbar">
          <button
            type="button"
            className="admin-menu-toggle"
            aria-label="Mở menu công dân"
            aria-expanded={sidebarOpen}
            onClick={() => setSidebarOpen(true)}
          >
            <List size={22} />
          </button>
          <button
            type="button"
            className={`admin-collapse-button ${sidebarCollapsed ? 'is-collapsed' : ''}`}
            aria-label={sidebarCollapsed ? 'Mở rộng thanh điều hướng' : 'Thu gọn thanh điều hướng'}
            aria-controls="citizen-sidebar"
            aria-expanded={!sidebarCollapsed}
            onClick={() => setSidebarCollapsed((current) => !current)}
          >
            <SidebarSimple size={21} />
          </button>

          <div className="hidden md:flex items-center text-xs text-slate-500 gap-1.5 ml-2">
            <span>Cổng công dân</span>
            <CaretRight size={12} />
            <span className="font-semibold text-slate-800">{meta.title}</span>
          </div>

          <div className="admin-topbar-actions">
            {/* Chuông thông báo */}
            <button
              type="button"
              aria-label="Thông báo"
              onClick={() => selectSection('notifications')}
            >
              <Bell size={21} />
              {unreadNotificationsCount > 0 && <span>{unreadNotificationsCount}</span>}
            </button>

            {/* User Button */}
            <button
              type="button"
              className="admin-user-button"
              onClick={() => selectSection('profile')}
            >
              <span>CD</span>
              <div>
                <strong>Nguyễn Minh Anh</strong>
                <small>Công dân điện tử</small>
              </div>
              <CaretDown size={14} />
            </button>
          </div>
        </header>

        {/* NỘI DUNG CHÍNH (MAIN) */}
        <main id="citizen-main" className="admin-main" tabIndex={-1}>
          {/* Header Trang */}
          <div className="admin-page-heading">
            <div>
              <h1>{meta.title}</h1>
              {meta.subtitle && <p className="mt-1 text-xs text-slate-500">{meta.subtitle}</p>}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {activeSection === 'dashboard' && (
                <button
                  className="admin-primary-action"
                  type="button"
                  onClick={() => selectSection('procedures')}
                >
                  <Plus size={18} weight="bold" /> Chuẩn bị hồ sơ mới
                </button>
              )}
              {isDossierSection && (
                <button
                  className="admin-primary-action"
                  type="button"
                  onClick={() => selectSection('procedures')}
                >
                  <Plus size={18} weight="bold" /> Nộp hồ sơ mới
                </button>
              )}
              {activeSection === 'prep_documents' && (
                <button
                  className="admin-primary-action"
                  type="button"
                  onClick={() => toast.info('Mở hộp thoại chọn giấy tờ từ máy tính hoặc điện thoại')}
                >
                  <UploadSimple size={18} weight="bold" /> Tải lên giấy tờ mới
                </button>
              )}
            </div>
          </div>

          {/* RENDER VIEW THEO SECTION ĐANG CHỌN */}
          {activeSection === 'dashboard' && (
            <CitizenDashboardView
              dossiers={dossiers}
              onSelectSection={selectSection}
              onOpenFeedback={handleOpenFeedback}
            />
          )}

          {activeSection === 'procedures' && (
            <CitizenProceduresView
              query={query}
              setQuery={setQuery}
              procedures={citizenProcedures}
              onSelectSection={selectSection}
            />
          )}

          {isDossierSection && (
            <CitizenDossiersView
              activeSection={activeSection}
              dossiers={dossiers}
              onOpenFeedback={handleOpenFeedback}
              onSelectSection={selectSection}
            />
          )}

          {activeSection === 'prep_checklist' && (
            <CitizenPrepChecklistView onSelectSection={selectSection} />
          )}

          {activeSection === 'prep_documents' && (
            <CitizenPrepDocumentsView documents={citizenDocuments} />
          )}

          {activeSection === 'prep_forms' && (
            <CitizenPrepFormsView forms={citizenForms} />
          )}

          {activeSection === 'prep_pdfs' && (
            <CitizenPrepPdfsView pdfs={citizenPdfs} />
          )}

          {activeSection === 'notifications' && (
            <CitizenNotificationsView
              notifications={notifications}
              onMarkAllRead={() => {
                setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
                toast.success('Đã đánh dấu đọc tất cả thông báo.');
              }}
            />
          )}

          {activeSection === 'qr_code' && (
            <CitizenQrCodeView dossiers={dossiers} />
          )}

          {activeSection === 'feedback' && (
            <CitizenFeedbackView onOpenFeedback={handleOpenFeedback} />
          )}

          {activeSection === 'profile' && (
            <CitizenProfileView />
          )}
        </main>
      </div>

      {/* Modal Đánh giá dịch vụ */}
      <CitizenFeedbackModal
        open={isFeedbackModalOpen}
        onOpenChange={setIsFeedbackModalOpen}
        procedureName={selectedFeedbackDossier.procedure}
        applicationCode={selectedFeedbackDossier.code}
        onSubmitFeedback={handleSubmitFeedback}
      />

      {/* Modal Xác nhận Đăng xuất */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <span className="grid size-12 place-items-center rounded-xl bg-red-50 text-red-700">
                <SignOut size={24} weight="bold" />
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-950">Xác nhận đăng xuất</h3>
                <p className="text-xs text-slate-500">Bạn muốn kết thúc phiên làm việc hiện tại?</p>
              </div>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-slate-600">
              Các thông tin bản nháp chưa lưu sẽ được lưu tạm trong trình duyệt. Bạn có thể đăng nhập lại bất kỳ lúc nào để tiếp tục chuẩn bị hồ sơ.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                onClick={() => setIsLogoutModalOpen(false)}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                className="rounded-lg bg-red-800 px-4 py-2 text-xs font-bold text-white hover:bg-red-900 shadow-sm"
                onClick={handleLogoutConfirm}
              >
                Đăng xuất ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------
// 1. DASHBOARD VIEW (TỔNG QUAN CÔNG DÂN)
// ----------------------------------------------------------------------
function CitizenDashboardView({
  dossiers,
  onSelectSection,
  onOpenFeedback,
}: {
  dossiers: CitizenDossier[];
  onSelectSection: (id: CitizenSectionId) => void;
  onOpenFeedback: (procedure: string, code?: string) => void;
}) {
  const pendingCount = dossiers.filter((d) => d.status === 'Chờ tiền kiểm').length;
  const revisionCount = dossiers.filter((d) => d.status === 'Cần chỉnh sửa').length;
  const approvedCount = dossiers.filter((d) => d.status === 'Đã duyệt').length;
  const completedCount = dossiers.filter((d) => d.status === 'Đã hoàn thành').length;

  const stats = [
    { label: 'Hồ sơ đang xử lý', value: `${pendingCount + revisionCount}`, icon: Clock, tone: 'info', sub: 'Đang thẩm tra & bổ sung' },
    { label: 'Cần bổ sung gấp', value: `${revisionCount}`, icon: WarningCircle, tone: 'danger', sub: 'Yêu cầu chụp lại giấy tờ' },
    { label: 'Đã duyệt tiền kiểm', value: `${approvedCount}`, icon: CheckCircle, tone: 'warning', sub: 'Sẵn sàng mang đến Một cửa' },
    { label: 'Đã hoàn tất thủ tục', value: `${completedCount}`, icon: SealCheck, tone: 'success', sub: 'Đã nhận kết quả bản gốc' },
  ];

  const quickShortcuts = [
    { id: 'procedures' as CitizenSectionId, title: 'Tra cứu thủ tục', desc: 'Xem quy định & biểu mẫu', icon: MagnifyingGlass },
    { id: 'prep_checklist' as CitizenSectionId, title: 'Checklist giấy tờ', desc: 'Kiểm tra độ đầy đủ', icon: Checks },
    { id: 'prep_documents' as CitizenSectionId, title: 'Kho giấy tờ số', desc: 'Quản lý CCCD & văn bản', icon: CloudArrowUp },
    { id: 'qr_code' as CitizenSectionId, title: 'Mã QR nộp hồ sơ', desc: 'Quét tại quầy Một cửa', icon: QrCode },
  ];

  return (
    <>
      {/* 4 Thẻ chỉ số */}
      <section className="admin-stat-grid" aria-label="Chỉ số hồ sơ của tôi">
        {stats.map(({ label, value, icon: Icon, tone, sub }) => (
          <article key={label} className={`admin-stat-card is-${tone}`}>
            <div>
              <span>
                <Icon size={24} weight="duotone" />
              </span>
              <small>{label}</small>
            </div>
            <strong>{value}</strong>
            <p className="mt-1 text-[11px] text-slate-500">{sub}</p>
          </article>
        ))}
      </section>

      {/* Biểu đồ xu hướng */}
      <CitizenUsageChart />

      {/* Phím tắt thao tác nhanh */}
      <section className="admin-card admin-module-card">
        <div className="admin-card-heading">
          <div>
            <h2>Tiện ích nộp & Chuẩn bị hồ sơ</h2>
          </div>
        </div>
        <div className="admin-module-grid">
          {quickShortcuts.map(({ id, title, desc, icon: Icon }) => (
            <button key={id} type="button" onClick={() => onSelectSection(id)}>
              <span>
                <Icon size={22} weight="duotone" />
              </span>
              <div>
                <strong>{title}</strong>
                <p className="text-[11px] text-slate-500 mt-0.5">{desc}</p>
              </div>
              <CaretDown size={16} />
            </button>
          ))}
        </div>
      </section>

      {/* 2 Khối thông tin: Hồ sơ gần đây & Lưu ý hướng dẫn */}
      <section className="admin-insight-grid">
        <article className="admin-card">
          <div className="admin-card-heading">
            <div>
              <h2>Hồ sơ gần đây của bạn</h2>
            </div>
            <button type="button" onClick={() => onSelectSection('dossiers_all')}>
              Xem tất cả
            </button>
          </div>

          <div className="divide-y divide-slate-100 px-5">
            {dossiers.slice(0, 4).map((dossier) => (
              <div key={dossier.code} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3.5">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <strong className="text-xs text-slate-900">{dossier.code}</strong>
                    <span className={`admin-status-badge ${getStatusBadgeClass(dossier.status)}`}>
                      {dossier.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-slate-800 truncate">{dossier.procedureName}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Cập nhật: {dossier.updatedAt}</p>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {dossier.status === 'Cần chỉnh sửa' && (
                    <button
                      type="button"
                      className="rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800 hover:bg-amber-100"
                      onClick={() => onSelectSection('dossiers_need_revision')}
                    >
                      Bổ sung ngay
                    </button>
                  )}
                  {dossier.status === 'Đã hoàn thành' && (
                    <button
                      type="button"
                      className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-200"
                      onClick={() => onOpenFeedback(dossier.procedureName, dossier.code)}
                    >
                      Đánh giá
                    </button>
                  )}
                  <button
                    type="button"
                    className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-600 hover:bg-slate-50"
                    onClick={() => onSelectSection('qr_code')}
                  >
                    Xem QR
                  </button>
                </div>
              </div>
            ))}
          </div>
        </article>

        {/* Khối Hướng dẫn Một cửa */}
        <article className="admin-card">
          <div className="admin-card-heading">
            <div>
              <h2>Lưu ý khi đến UBND Phường</h2>
            </div>
          </div>
          <div className="p-5 space-y-3.5 text-xs text-slate-600 leading-relaxed">
            <div className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3">
              <ShieldCheck size={20} className="shrink-0 text-emerald-600 mt-0.5" />
              <div>
                <strong className="block text-slate-900 font-bold">Đối chiếu giấy tờ gốc</strong>
                <span>Tiền kiểm trực tuyến giúp bạn chuẩn bị đủ 100% giấy tờ trước khi mang bản gốc đến đối chiếu tại Một cửa.</span>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3">
              <QrCode size={20} className="shrink-0 text-red-700 mt-0.5" />
              <div>
                <strong className="block text-slate-900 font-bold">Quét mã QR tại Ki-ốt</strong>
                <span>Xuất trình mã QR hồ sơ đã duyệt để lấy số thứ tự ưu tiên tại UBND phường.</span>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3">
              <Clock size={20} className="shrink-0 text-sky-600 mt-0.5" />
              <div>
                <strong className="block text-slate-900 font-bold">Giờ làm việc tiếp nhận</strong>
                <span>Sáng: 07:30 – 11:30 | Chiều: 13:30 – 17:00 (Từ Thứ Hai đến Thứ Sáu, Thứ Bảy làm việc buổi sáng).</span>
              </div>
            </div>
          </div>
        </article>
      </section>
    </>
  );
}

// ----------------------------------------------------------------------
// BIỂU ĐỒ XU HƯỚNG SỬ DỤNG DỊCH VỤ CÔNG DÂN
// ----------------------------------------------------------------------
function CitizenUsageChart() {
  const [range, setRange] = useState<ChartRange>('week');
  const data = citizenChartData[range];
  const totalViews = data.reduce((total, item) => total + item.views, 0);
  const totalDossiers = data.reduce((total, item) => total + item.dossiers, 0);
  const rangeLabels: Array<{ id: ChartRange; label: string }> = [
    { id: 'day', label: 'Ngày' },
    { id: 'week', label: 'Tuần' },
    { id: 'month', label: 'Tháng' },
    { id: 'year', label: 'Năm' },
  ];

  return (
    <section className="admin-card admin-chart-card" aria-labelledby="citizen-chart-title">
      <div className="admin-chart-heading">
        <div>
          <h2 id="citizen-chart-title">Nhật ký tra cứu & Tiến độ chuẩn bị hồ sơ</h2>
        </div>
        <div className="admin-chart-filters" aria-label="Khoảng thời gian">
          {rangeLabels.map((item) => (
            <button
              key={item.id}
              type="button"
              className={range === item.id ? 'is-active' : ''}
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
            <small>Lượt tra cứu & xem hướng dẫn</small>
            <strong>{totalViews.toLocaleString('vi-VN')}</strong>
          </p>
        </div>
        <div>
          <span className="is-application" />
          <p>
            <small>Hồ sơ đã chuẩn bị & gửi</small>
            <strong>{totalDossiers.toLocaleString('vi-VN')}</strong>
          </p>
        </div>
      </div>

      <div
        className="admin-chart-canvas"
        role="img"
        aria-label={`Biểu đồ ${totalViews} lượt tra cứu và ${totalDossiers} hồ sơ theo ${rangeLabels.find((r) => r.id === range)?.label.toLowerCase()}`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 12, right: 8, left: -16, bottom: 0 }} accessibilityLayer>
            <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="4 4" />
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} width={48} />
            <Tooltip
              cursor={{ stroke: '#cbd5e1', strokeDasharray: '4 4' }}
              contentStyle={{
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                boxShadow: '0 12px 30px rgba(15,23,42,.10)',
                fontSize: 12,
              }}
              labelStyle={{ color: '#0f172a', fontWeight: 700, marginBottom: 6 }}
              formatter={(value, name) => [
                Number(value).toLocaleString('vi-VN'),
                name === 'views' ? 'Lượt xem quy trình' : 'Hồ sơ đã chuẩn bị',
              ]}
            />
            <Area
              type="monotone"
              dataKey="views"
              stroke="#991d18"
              strokeWidth={2.5}
              fill="#991d18"
              fillOpacity={0.08}
              activeDot={{ r: 5, strokeWidth: 3, stroke: '#fff', fill: '#991d18' }}
            />
            <Area
              type="monotone"
              dataKey="dossiers"
              stroke="#c89000"
              strokeWidth={2.5}
              fill="#ffcd00"
              fillOpacity={0.07}
              activeDot={{ r: 5, strokeWidth: 3, stroke: '#fff', fill: '#c89000' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

// ----------------------------------------------------------------------
// 2. TRA CỨU THỦ TỤC
// ----------------------------------------------------------------------
function CitizenProceduresView({
  query,
  setQuery,
  procedures,
  onSelectSection,
}: {
  query: string;
  setQuery: (q: string) => void;
  procedures: typeof citizenProcedures;
  onSelectSection: (id: CitizenSectionId) => void;
}) {
  const [selectedField, setSelectedField] = useState('all');

  const filtered = useMemo(() => {
    return procedures.filter((p) => {
      const matchQuery = `${p.code} ${p.name} ${p.field}`.toLowerCase().includes(query.toLowerCase());
      const matchField = selectedField === 'all' || p.field === selectedField;
      return matchQuery && matchField;
    });
  }, [procedures, query, selectedField]);

  return (
    <section className="admin-card admin-table-card admin-content-card">
      <div className="admin-toolbar">
        <label className="admin-search">
          <MagnifyingGlass size={18} />
          <span className="sr-only">Tìm kiếm thủ tục</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm theo mã thủ tục, tên thủ tục hoặc lĩnh vực..."
          />
        </label>

        <div className="flex items-center gap-2">
          <select
            className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none"
            value={selectedField}
            onChange={(e) => setSelectedField(e.target.value)}
          >
            <option value="all">Tất cả lĩnh vực</option>
            <option value="Hộ tịch">Hộ tịch</option>
            <option value="Chứng thực">Chứng thực</option>
            <option value="Địa chính">Địa chính</option>
          </select>
        </div>
      </div>

      <div className="admin-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Mã thủ tục</th>
              <th>Tên thủ tục hành chính</th>
              <th>Lĩnh vực</th>
              <th>Thời hạn giải quyết</th>
              <th>Lệ phí</th>
              <th className="text-right">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.code}>
                <td>
                  <strong>{item.code}</strong>
                </td>
                <td>
                  <span className="font-semibold text-slate-900">{item.name}</span>
                </td>
                <td>
                  <span className="admin-status-badge is-info">{item.field}</span>
                </td>
                <td>{item.duration}</td>
                <td className="font-medium text-slate-800">{item.fee}</td>
                <td>
                  <button
                    type="button"
                    onClick={() => {
                      toast.info(`Bắt đầu chuẩn bị hồ sơ: ${item.name}`);
                      onSelectSection('prep_checklist');
                    }}
                  >
                    Chuẩn bị hồ sơ
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && <p className="admin-empty">Không tìm thấy thủ tục nào phù hợp với từ khóa.</p>}
    </section>
  );
}

// ----------------------------------------------------------------------
// 3. HỒ SƠ CỦA TÔI (TẤT CẢ VÀ CÁC SUB-ITEMS THEO TRẠNG THÁI)
// ----------------------------------------------------------------------
function CitizenDossiersView({
  activeSection,
  dossiers,
  onOpenFeedback,
  onSelectSection,
}: {
  activeSection: CitizenSectionId;
  dossiers: CitizenDossier[];
  onOpenFeedback: (procedure: string, code?: string) => void;
  onSelectSection: (id: CitizenSectionId) => void;
}) {
  const [searchTerm, setSearchTerm] = useState('');

  // Map activeSection sang trạng thái lọc
  const targetStatus = useMemo(() => {
    switch (activeSection) {
      case 'dossiers_draft':
        return 'Bản nháp';
      case 'dossiers_pending':
        return 'Chờ tiền kiểm';
      case 'dossiers_need_revision':
        return 'Cần chỉnh sửa';
      case 'dossiers_resubmitted':
        return 'Đã gửi lại';
      case 'dossiers_approved':
        return 'Đã duyệt';
      case 'dossiers_completed':
        return 'Đã hoàn thành';
      default:
        return 'ALL';
    }
  }, [activeSection]);

  const filteredDossiers = useMemo(() => {
    return dossiers.filter((d) => {
      const matchStatus = targetStatus === 'ALL' || d.status === targetStatus;
      const matchSearch =
        d.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.procedureName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.field.toLowerCase().includes(searchTerm.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [dossiers, targetStatus, searchTerm]);

  return (
    <section className="admin-card admin-table-card admin-content-card">
      <div className="admin-toolbar">
        <label className="admin-search">
          <MagnifyingGlass size={18} />
          <span className="sr-only">Tìm hồ sơ</span>
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo mã hồ sơ, tên thủ tục..."
          />
        </label>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onSelectSection('procedures')}
            className="!bg-red-800 !text-white hover:!bg-red-900 border-none"
          >
            <Plus size={16} weight="bold" /> Nộp hồ sơ mới
          </button>
        </div>
      </div>

      <div className="admin-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Mã hồ sơ</th>
              <th>Thủ tục hành chính</th>
              <th>Thời gian cập nhật</th>
              <th>Trạng thái</th>
              <th>Ghi chú cán bộ</th>
              <th className="text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredDossiers.map((item) => (
              <tr key={item.code}>
                <td>
                  <strong className="text-slate-900">{item.code}</strong>
                  <small className="block text-[10px] text-slate-400">Tạo: {item.createdAt}</small>
                </td>
                <td>
                  <span className="font-semibold text-slate-900">{item.procedureName}</span>
                  <small className="block text-[11px] text-slate-500">Lĩnh vực: {item.field}</small>
                </td>
                <td>{item.updatedAt}</td>
                <td>
                  <span className={`admin-status-badge ${getStatusBadgeClass(item.status)}`}>
                    {item.status}
                  </span>
                </td>
                <td className="max-w-[280px]">
                  <p className="truncate text-xs text-slate-600" title={item.officerNote}>
                    {item.officerNote || '—'}
                  </p>
                  {item.officerName && (
                    <small className="block text-[10px] text-slate-400 truncate">Cán bộ: {item.officerName}</small>
                  )}
                </td>
                <td>
                  <div className="flex items-center justify-end gap-1.5">
                    {item.status === 'Cần chỉnh sửa' && (
                      <button
                        type="button"
                        className="!text-amber-800 hover:!bg-amber-50"
                        onClick={() => toast.info(`Mở giao diện bổ sung giấy tờ cho hồ sơ ${item.code}`)}
                      >
                        Chỉnh sửa
                      </button>
                    )}
                    {item.status === 'Đã hoàn thành' && (
                      <button
                        type="button"
                        className="!text-emerald-700 hover:!bg-emerald-50"
                        onClick={() => onOpenFeedback(item.procedureName, item.code)}
                      >
                        Đánh giá
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onSelectSection('qr_code')}
                      title="Xem mã QR hồ sơ"
                    >
                      Mã QR
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredDossiers.length === 0 && (
        <p className="admin-empty">
          {targetStatus === 'ALL'
            ? 'Bạn chưa có hồ sơ nào trong mục này.'
            : `Không có hồ sơ nào ở trạng thái "${targetStatus}".`}
        </p>
      )}
    </section>
  );
}

// ----------------------------------------------------------------------
// 4. CHUẨN BỊ HỒ SƠ - CHECKLIST
// ----------------------------------------------------------------------
function CitizenPrepChecklistView({ onSelectSection }: { onSelectSection: (id: CitizenSectionId) => void }) {
  const [items, setItems] = useState([
    { id: 1, name: 'Căn cước công dân gắn chip (Bản chính + Bản sao)', required: true, checked: true },
    { id: 2, name: 'Giấy chứng sinh do cơ sở y tế có thẩm quyền cấp', required: true, checked: true },
    { id: 3, name: 'Giấy chứng nhận kết hôn của cha mẹ', required: true, checked: false },
    { id: 4, name: 'Tờ khai đăng ký khai sinh theo mẫu điện tử', required: true, checked: true },
    { id: 5, name: 'Văn bản ủy quyền (nếu người nộp không phải cha/mẹ)', required: false, checked: false },
  ]);

  const checkedCount = items.filter((i) => i.checked).length;
  const percent = Math.round((checkedCount / items.length) * 100);

  function toggleItem(id: number) {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i))
    );
  }

  return (
    <div className="space-y-4 admin-content-card">
      <section className="admin-card p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="admin-status-badge is-info mb-1">Thủ tục: Đăng ký khai sinh</span>
            <h2 className="text-base font-bold text-slate-950">Danh mục giấy tờ cần chuẩn bị</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Đã chuẩn bị hoàn tất {checkedCount} / {items.length} hạng mục giấy tờ ({percent}%)
            </p>
          </div>

          <button
            type="button"
            className="admin-primary-action shrink-0"
            onClick={() => onSelectSection('prep_documents')}
          >
            <CloudArrowUp size={18} weight="bold" /> Tải giấy tờ còn thiếu
          </button>
        </div>

        {/* Thanh tiến độ */}
        <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full bg-red-800 transition-all duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>
      </section>

      {/* Danh sách checklist */}
      <section className="admin-card divide-y divide-slate-100">
        {items.map((item) => (
          <label
            key={item.id}
            className="flex items-center gap-3.5 p-4 cursor-pointer hover:bg-slate-50 transition-colors"
          >
            <input
              type="checkbox"
              checked={item.checked}
              onChange={() => toggleItem(item.id)}
              className="size-4 rounded border-slate-300 text-red-800 focus:ring-red-500"
            />
            <div className="min-w-0 flex-1">
              <span className={`text-xs font-semibold ${item.checked ? 'text-slate-800 line-through' : 'text-slate-900'}`}>
                {item.name}
              </span>
              {item.required ? (
                <span className="ml-2 text-[10px] font-bold text-red-600">Bắt buộc</span>
              ) : (
                <span className="ml-2 text-[10px] text-slate-400">Tùy trường hợp</span>
              )}
            </div>
            {item.checked ? (
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                <CheckCircle size={16} /> Đã có
              </span>
            ) : (
              <span className="text-xs text-amber-600 font-medium">Chưa chuẩn bị</span>
            )}
          </label>
        ))}
      </section>
    </div>
  );
}

// ----------------------------------------------------------------------
// 5. CHUẨN BỊ HỒ SƠ - GIẤY TỜ ĐÃ TẢI LÊN
// ----------------------------------------------------------------------
function CitizenPrepDocumentsView({ documents }: { documents: typeof citizenDocuments }) {
  return (
    <section className="admin-card admin-content-card">
      <div className="admin-card-heading">
        <div>
          <h2>Kho tài liệu điện tử dùng chung</h2>
          <p className="text-xs text-slate-500">Giấy tờ sau khi tiền kiểm hợp lệ có thể tái sử dụng cho các thủ tục khác</p>
        </div>
        <button
          type="button"
          onClick={() => toast.success('Đã mở cửa sổ chọn tài liệu từ thiết bị')}
        >
          <UploadSimple size={16} /> Tải thêm giấy tờ
        </button>
      </div>

      <div className="admin-resource-grid">
        {documents.map((doc) => (
          <article key={doc.id}>
            <span>
              <FileText size={24} />
            </span>
            <div>
              <strong>{doc.name}</strong>
              <small>
                {doc.type} · {doc.size} · Tải lên {doc.updatedAt}
              </small>
            </div>
            {doc.verified ? (
              <em className="is-success">Hợp lệ</em>
            ) : (
              <em className="is-warning">Chờ thẩm tra</em>
            )}
            <button
              type="button"
              onClick={() => toast.info(`Đang mở xem trước: ${doc.name}`)}
            >
              Xem
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

// ----------------------------------------------------------------------
// 6. CHUẨN BỊ HỒ SƠ - BIỂU MẪU
// ----------------------------------------------------------------------
function CitizenPrepFormsView({ forms }: { forms: typeof citizenForms }) {
  return (
    <section className="admin-card admin-content-card">
      <div className="admin-card-heading">
        <div>
          <h2>Kho mẫu đơn & Biểu mẫu điện tử (E-Form)</h2>
          <p className="text-xs text-slate-500">Kê khai trực tuyến để hệ thống tự động điền thông tin định danh</p>
        </div>
      </div>

      <div className="admin-resource-grid">
        {forms.map((form) => (
          <article key={form.id}>
            <span>
              <FileCode size={24} />
            </span>
            <div>
              <strong>{form.title}</strong>
              <small>
                Mã mẫu: {form.code} · {form.fields} trường thông tin · Áp dụng cho: {form.appliesTo}
              </small>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="!bg-red-800 !text-white hover:!bg-red-900"
                onClick={() => toast.success(`Đã mở giao diện kê khai trực tuyến mẫu: ${form.title}`)}
              >
                Khai trực tuyến
              </button>
              <button
                type="button"
                onClick={() => toast.info(`Tải xuống mẫu file Word (.docx) của ${form.code}`)}
              >
                Tải mẫu
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

// ----------------------------------------------------------------------
// 7. CHUẨN BỊ HỒ SƠ - PDF ĐÃ TẠO
// ----------------------------------------------------------------------
function CitizenPrepPdfsView({ pdfs }: { pdfs: typeof citizenPdfs }) {
  return (
    <section className="admin-card admin-content-card">
      <div className="admin-card-heading">
        <div>
          <h2>Bản in PDF & Phiếu hẹn có mã QR tiền kiểm</h2>
          <p className="text-xs text-slate-500">Xuất trình bản in hoặc mở file PDF trên điện thoại khi đến nộp tại Một cửa</p>
        </div>
      </div>

      <div className="admin-resource-grid is-list">
        {pdfs.map((pdf) => (
          <article key={pdf.id} className="flex-col sm:flex-row sm:items-center">
            <span className="!bg-red-100 !text-red-800">
              <FilePdf size={24} />
            </span>
            <div className="min-w-0 flex-1">
              <strong>{pdf.title}</strong>
              <small>
                Mã hồ sơ: {pdf.code} · {pdf.procedure} · Tạo ngày: {pdf.date}
              </small>
              <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                <QrCode size={13} /> {pdf.qrCode}
              </span>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                type="button"
                onClick={() => toast.info(`Đang mở xem trước file ${pdf.title}`)}
              >
                <Eye size={15} /> Xem
              </button>
              <button
                type="button"
                onClick={() => toast.success(`Đang tải file ${pdf.title} về máy`)}
              >
                <DownloadSimple size={15} /> Tải PDF
              </button>
              <button
                type="button"
                onClick={() => toast.info('Kết nối máy in hoàn tất')}
              >
                <Printer size={15} /> In
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

// ----------------------------------------------------------------------
// 8. THÔNG BÁO
// ----------------------------------------------------------------------
function CitizenNotificationsView({
  notifications,
  onMarkAllRead,
}: {
  notifications: typeof citizenNotifications;
  onMarkAllRead: () => void;
}) {
  return (
    <section className="admin-card admin-content-card">
      <div className="admin-card-heading">
        <div>
          <h2>Hộp thư thông báo tiến độ</h2>
          <p className="text-xs text-slate-500">Cập nhật kết quả tiền kiểm hồ sơ hành chính</p>
        </div>
        <button type="button" onClick={onMarkAllRead}>
          Đánh dấu đã đọc tất cả
        </button>
      </div>

      <div className="divide-y divide-slate-100">
        {notifications.map((item) => (
          <div
            key={item.id}
            className={`flex items-start gap-3.5 p-5 transition-colors ${item.read ? 'bg-white' : 'bg-red-50/30'}`}
          >
            <span
              className={`grid size-9 shrink-0 place-items-center rounded-full text-white ${
                item.type === 'success'
                  ? 'bg-emerald-600'
                  : item.type === 'warning'
                  ? 'bg-amber-500'
                  : 'bg-sky-600'
              }`}
            >
              <Bell size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <strong className={`text-xs ${item.read ? 'text-slate-800' : 'text-slate-950 font-bold'}`}>
                  {item.title}
                </strong>
                <small className="text-[10px] text-slate-400 shrink-0">{item.time}</small>
              </div>
              <p className="mt-1 text-xs text-slate-600 leading-relaxed">{item.content}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ----------------------------------------------------------------------
// 9. MÃ QR HỒ SƠ
// ----------------------------------------------------------------------
function CitizenQrCodeView({ dossiers }: { dossiers: CitizenDossier[] }) {
  const [selectedCode, setSelectedCode] = useState(dossiers[0]?.code || 'HS-2026-00094');
  const activeDossier = dossiers.find((d) => d.code === selectedCode) || dossiers[0];

  return (
    <div className="admin-split-view admin-content-card">
      {/* Khối hiển thị QR Code */}
      <section className="admin-card p-6 flex flex-col items-center text-center">
        <span className="admin-status-badge is-success mb-3">Mã hợp lệ tiền kiểm</span>
        <h2 className="text-lg font-bold text-slate-950">{activeDossier.procedureName}</h2>
        <p className="text-xs text-slate-500 mt-1">Mã tra cứu: <span className="font-mono font-bold text-slate-800">{activeDossier.code}</span></p>

        {/* Khung QR minh họa sắc nét */}
        <div className="my-6 rounded-2xl border-4 border-slate-900 bg-white p-5 shadow-lg">
          <div className="relative size-48 sm:size-56 grid place-items-center bg-slate-950 text-white rounded-lg p-3">
            <QrCode size={190} weight="regular" />
            <div className="absolute inset-0 grid place-items-center pointer-events-none">
              <div className="size-10 rounded-lg bg-red-800 border-2 border-white grid place-items-center shadow-md">
                <BrandMark size={22} className="text-white" />
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-md text-xs text-slate-600 space-y-1">
          <p>Xuất trình mã này cho cán bộ Bộ phận Một cửa hoặc quét tại ki-ốt tiếp nhận.</p>
          <p className="text-[11px] text-slate-400">Thời gian tạo mã: {activeDossier.updatedAt}</p>
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            className="admin-primary-action"
            onClick={() => toast.success('Đã tải hình ảnh mã QR về điện thoại')}
          >
            <DownloadSimple size={17} weight="bold" /> Tải ảnh mã QR
          </button>
          <button
            type="button"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 hover:bg-slate-50"
            onClick={() => toast.info('Đang kết nối máy in')}
          >
            <Printer size={17} /> In phiếu hẹn
          </button>
        </div>
      </section>

      {/* Danh sách chọn hồ sơ xem mã QR */}
      <aside className="admin-card p-5">
        <h3 className="text-sm font-bold text-slate-950 mb-3">Chọn hồ sơ xem mã QR</h3>
        <div className="space-y-2">
          {dossiers.map((d) => (
            <button
              key={d.code}
              type="button"
              onClick={() => setSelectedCode(d.code)}
              className={`w-full text-left p-3 rounded-xl border transition-all ${
                selectedCode === d.code
                  ? 'border-red-600 bg-red-50/50 shadow-sm'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <strong className="text-xs font-mono font-bold text-slate-900">{d.code}</strong>
                <span className={`admin-status-badge ${getStatusBadgeClass(d.status)}`}>{d.status}</span>
              </div>
              <p className="mt-1 text-xs font-semibold text-slate-800 line-clamp-1">{d.procedureName}</p>
            </button>
          ))}
        </div>
      </aside>
    </div>
  );
}

// ----------------------------------------------------------------------
// 10. ĐÁNH GIÁ DỊCH VỤ
// ----------------------------------------------------------------------
function CitizenFeedbackView({
  onOpenFeedback,
}: {
  onOpenFeedback: (procedure: string, code?: string) => void;
}) {
  const previousReviews = [
    {
      id: 'rev-1',
      procedure: 'Chứng thực bản sao từ bản chính',
      rating: 5,
      date: '28/09/2026',
      tags: ['Thủ tục rõ ràng', 'Cán bộ nhiệt tình', 'Tiền kiểm nhanh chóng'],
      comment: 'Hệ thống tiền kiểm hồ sơ trực tuyến rất thuận tiện, đến nơi chỉ mất 5 phút đối chiếu là xong.',
      response: 'UBND Phường An Khánh chân thành cảm ơn phản hồi tích cực của bạn.',
    },
    {
      id: 'rev-2',
      procedure: 'Xác nhận tình trạng hôn nhân',
      rating: 4,
      date: '15/08/2026',
      tags: ['Hướng dẫn dễ hiểu'],
      comment: 'Giao diện thân thiện, dễ tra cứu danh mục giấy tờ.',
      response: 'Cảm ơn bạn đã đóng góp ý kiến để hoàn thiện chất lượng dịch vụ.',
    },
  ];

  return (
    <div className="space-y-4 admin-content-card">
      <section className="admin-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="admin-status-badge is-success mb-1">Khảo sát sự hài lòng</span>
          <h2 className="text-base font-bold text-slate-950">Góp ý chất lượng phục vụ công dân</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Mỗi ý kiến đóng góp của bạn giúp nâng cao trải nghiệm giải quyết thủ tục hành chính tại phường
          </p>
        </div>

        <button
          type="button"
          className="admin-primary-action shrink-0"
          onClick={() => onOpenFeedback('Đăng ký khai sinh', 'HS-2026-00128')}
        >
          <Star size={18} weight="fill" /> Gửi đánh giá mới
        </button>
      </section>

      {/* Lịch sử đánh giá */}
      <section className="admin-card">
        <div className="admin-card-heading">
          <div>
            <h2>Lịch sử đánh giá của bạn</h2>
          </div>
        </div>

        <div className="divide-y divide-slate-100 p-5 space-y-4">
          {previousReviews.map((rev) => (
            <div key={rev.id} className="pt-4 first:pt-0">
              <div className="flex items-center justify-between">
                <div>
                  <strong className="text-sm font-bold text-slate-900">{rev.procedure}</strong>
                  <small className="block text-[11px] text-slate-400">Đánh giá ngày: {rev.date}</small>
                </div>
                <div className="flex items-center gap-1 text-gold-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={17}
                      weight={i < rev.rating ? 'fill' : 'regular'}
                      className={i < rev.rating ? 'text-amber-400' : 'text-slate-300'}
                    />
                  ))}
                </div>
              </div>

              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {rev.tags.map((tag) => (
                  <span key={tag} className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                    {tag}
                  </span>
                ))}
              </div>

              <p className="mt-2 text-xs text-slate-700 leading-relaxed italic bg-slate-50 p-3 rounded-lg border border-slate-100">
                "{rev.comment}"
              </p>

              {rev.response && (
                <div className="mt-2 ml-4 border-l-2 border-red-800 pl-3 text-xs text-slate-600">
                  <span className="font-bold text-red-900 block text-[11px]">Phản hồi từ Bộ phận Một cửa:</span>
                  <span>{rev.response}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// ----------------------------------------------------------------------
// 11. HỒ SƠ CÁ NHÂN
// ----------------------------------------------------------------------
function CitizenProfileView() {
  const [profile, setProfile] = useState({
    fullName: 'Nguyễn Minh Anh',
    identityNumber: '001092008128',
    birthDate: '15/08/1992',
    gender: 'Nữ',
    phone: '090 000 0128',
    email: 'minhanh@example.com',
    permanentAddress: 'Số 12 ngách 4/8 Phường An Khánh, Thành phố Hà Nội',
    temporaryAddress: 'Số 12 ngách 4/8 Phường An Khánh, Thành phố Hà Nội',
  });

  const [isEditing, setIsEditing] = useState(false);

  function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setIsEditing(false);
    toast.success('Đã lưu thông tin định danh công dân thành công.');
  }

  return (
    <div className="space-y-5 admin-content-card">
      <section className="admin-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-4">
            <span className="grid size-14 place-items-center rounded-2xl bg-red-800 text-lg font-bold text-white shadow-sm">
              CD
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-950">{profile.fullName}</h2>
                <span className="admin-status-badge is-success">Đã định danh VNeID Mức 2</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Số định danh cá nhân / CCCD: {profile.identityNumber}</p>
            </div>
          </div>

          <button
            type="button"
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 hover:bg-slate-50"
            onClick={() => setIsEditing(!isEditing)}
          >
            <NotePencil size={16} /> {isEditing ? 'Hủy chỉnh sửa' : 'Chỉnh sửa thông tin'}
          </button>
        </div>

        <form onSubmit={handleSaveProfile} className="mt-6 grid gap-5 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold text-slate-700">Họ và tên</label>
            <input
              type="text"
              value={profile.fullName}
              disabled={!isEditing}
              onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
              className="mt-1.5 h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 text-xs font-medium text-slate-900 disabled:opacity-75"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700">Số CCCD / Mã định danh</label>
            <input
              type="text"
              value={profile.identityNumber}
              disabled
              className="mt-1.5 h-11 w-full rounded-lg border border-slate-200 bg-slate-100 px-3.5 text-xs font-medium text-slate-500 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700">Ngày sinh</label>
            <input
              type="text"
              value={profile.birthDate}
              disabled={!isEditing}
              onChange={(e) => setProfile({ ...profile, birthDate: e.target.value })}
              className="mt-1.5 h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 text-xs font-medium text-slate-900 disabled:opacity-75"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700">Giới tính</label>
            <input
              type="text"
              value={profile.gender}
              disabled={!isEditing}
              onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
              className="mt-1.5 h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 text-xs font-medium text-slate-900 disabled:opacity-75"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700">Số điện thoại liên hệ</label>
            <input
              type="text"
              value={profile.phone}
              disabled={!isEditing}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              className="mt-1.5 h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 text-xs font-medium text-slate-900 disabled:opacity-75"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700">Địa chỉ Email</label>
            <input
              type="email"
              value={profile.email}
              disabled={!isEditing}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              className="mt-1.5 h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 text-xs font-medium text-slate-900 disabled:opacity-75"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700">Nơi thường trú</label>
            <input
              type="text"
              value={profile.permanentAddress}
              disabled={!isEditing}
              onChange={(e) => setProfile({ ...profile, permanentAddress: e.target.value })}
              className="mt-1.5 h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 text-xs font-medium text-slate-900 disabled:opacity-75"
            />
          </div>

          {isEditing && (
            <div className="sm:col-span-2 flex justify-end gap-3 mt-2">
              <button
                type="button"
                className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                onClick={() => setIsEditing(false)}
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="rounded-lg bg-red-800 px-5 py-2 text-xs font-bold text-white hover:bg-red-900 shadow-sm"
              >
                Lưu thay đổi
              </button>
            </div>
          )}
        </form>
      </section>
    </div>
  );
}

// ----------------------------------------------------------------------
// HELPER TRẠNG THÁI BADGE
// ----------------------------------------------------------------------
function getStatusBadgeClass(status: CitizenDossier['status']): string {
  switch (status) {
    case 'Đã hoàn thành':
      return 'is-success';
    case 'Đã duyệt':
      return 'is-success';
    case 'Chờ tiền kiểm':
      return 'is-info';
    case 'Cần chỉnh sửa':
      return 'is-warning';
    case 'Đã gửi lại':
      return 'is-info';
    case 'Bản nháp':
    default:
      return 'is-warning';
  }
}
