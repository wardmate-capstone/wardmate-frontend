import { UserDropdown } from '@/components/layout/UserDropdown';
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useUserProfile } from '@/hooks/useUserProfile';
import { DossierChecklistView } from './components/DossierChecklistView';
import { FormDocxEditorModal } from './components/FormDocxEditorModal';
import { FormPreviewModal } from './components/FormPreviewModal';
import type { ProcedureCase, ChecklistItem } from '@/lib/procedureContent';
import { mockPublicProcedures } from '@/data/mockPublicProcedures';
import { parseProcedureContent } from '@/lib/procedureContent';
import {
  ArrowClockwise,
  ArrowLeft,
  Bell,
  CaretDown,
  CaretRight,
  CheckCircle,
  Clock,
  DownloadSimple,
  Eye,
  FileDashed,
  Folder,
  Funnel,
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
  Star,
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
import axios from 'axios';
import { updateMyProfile, authErrorMessage } from '@/lib/api';
import type { UserProfileDto } from '@/types/profile';
import { validateProfile, type ProfileFieldErrors } from '@/lib/profileSchema';

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
  | 'dossier_detail'
  // Tiện ích
  | 'notifications'
  | 'qr_code'
  | 'feedback'
  | 'profile';

// Kiểu dữ liệu hồ sơ công dân
export interface CitizenDossier {
  code: string;
  procedureId?: string;
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
  cases?: ProcedureCase[];
  checklist?: ChecklistItem[];
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
  dossier_detail: { title: 'Chi tiết hồ sơ & Checklist chuẩn bị', subtitle: 'Kiểm tra danh mục giấy tờ, tải mẫu và kê khai biểu mẫu trực tuyến' },
  notifications: { title: 'Thông báo & Cập nhật', subtitle: 'Tin nhắn tiến độ hồ sơ từ cán bộ tiếp nhận' },
  qr_code: { title: 'Mã QR hồ sơ điện tử', subtitle: 'Mã đối chiếu nhanh khi đến Bộ phận Một cửa UBND phường' },
  feedback: { title: 'Đánh giá dịch vụ & Sự hài lòng', subtitle: 'Góp ý chất lượng phục vụ tiền kiểm hồ sơ hành chính' },
  profile: { title: 'Hồ sơ cá nhân & Định danh', subtitle: 'Thông tin công dân, tài khoản VNeID và liên hệ' },
};

export function CitizenPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlSection = searchParams.get('section') as CitizenSectionId | null;
  const urlDossierCode = searchParams.get('dossierCode');

  const { profile: userProfile, loading: profileLoading, refetch: refetchProfile } = useUserProfile();
  const [activeSection, setActiveSection] = useState<CitizenSectionId>(() => urlSection || 'dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [query, setQuery] = useState('');

  // Expandable sections in sidebar
  const [isDossiersExpanded, setIsDossiersExpanded] = useState(true);

  // Khởi tạo dossiers kết hợp localStorage
  const [dossiers, setDossiers] = useState<CitizenDossier[]>(() => {
    try {
      const stored = localStorage.getItem('wardmate_citizen_drafts');
      if (stored) {
        const parsedDrafts: CitizenDossier[] = JSON.parse(stored);
        // Trộn các bản nháp từ localStorage lên đầu danh sách mẫu
        const existingCodes = new Set(parsedDrafts.map((d) => d.code));
        const filteredInitial = initialDossiers.filter((d) => !existingCodes.has(d.code));
        return [...parsedDrafts, ...filteredInitial];
      }
    } catch {
      // bỏ qua lỗi đọc storage
    }
    return initialDossiers;
  });

  // State Modal Chi tiết hồ sơ nháp & Checklist
  const [selectedDossierDetail, setSelectedDossierDetail] = useState<CitizenDossier | null>(null);

  // State Modal Preview Form và Editor Form
  const [previewFormItem, setPreviewFormItem] = useState<{ item: ChecklistItem; procedureName: string } | null>(null);
  const [editFormItem, setEditFormItem] = useState<{ item: ChecklistItem; procedureName: string } | null>(null);

  const [notifications, setNotifications] = useState(citizenNotifications);
  // Feedback modal state
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [selectedFeedbackDossier, setSelectedFeedbackDossier] = useState<{ procedure: string; code?: string }>({
    procedure: 'Chứng thực bản sao từ bản chính',
    code: 'HS-2026-00094',
  });

  // Xử lý khi URL thay đổi
  useEffect(() => {
    if (urlSection && urlSection !== activeSection) {
      setActiveSection(urlSection);
    }
    if (urlDossierCode) {
      const found = dossiers.find((d) => d.code === urlDossierCode);
      if (found) {
        if (!found.checklist || found.checklist.length === 0) {
          const matchProc = mockPublicProcedures.find(
            (p) =>
              p.title.toLowerCase() === found.procedureName.toLowerCase() ||
              found.procedureName.toLowerCase().includes(p.title.toLowerCase()) ||
              p.title.toLowerCase().includes(found.procedureName.toLowerCase()) ||
              p.id === found.procedureId
          );
          if (matchProc) {
            const parsed = parseProcedureContent(matchProc.content_payload, matchProc.checklist_schema);
            found.cases = parsed.content.cases;
            found.checklist = parsed.content.checklist;
          }
        }
        setSelectedDossierDetail(found);
        setActiveSection('dossier_detail');
      }
    }
  }, [urlSection, urlDossierCode, dossiers]);

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
    setActiveSection(id);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('section', id);
      next.delete('dossierCode');
      return next;
    });
    setQuery('');
    setSidebarOpen(false);
  }

  // Cập nhật dossiers khi cần (ví dụ nộp tiền kiểm)
  function handleUpdateDossierStatus(code: string, newStatus: CitizenDossier['status']) {
    setDossiers((prev) => {
      const next = prev.map((d) => (d.code === code ? { ...d, status: newStatus } : d));
      try {
        localStorage.setItem('wardmate_citizen_drafts', JSON.stringify(next.filter((d) => d.status === 'Bản nháp')));
      } catch {
        // ignore
      }
      return next;
    });
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
          <Link
            to="/"
            className="flex min-w-0 flex-1 items-center gap-3 transition-opacity hover:opacity-85 focus:outline-none"
            title="Về trang chủ WardMate"
            aria-label="Về trang chủ WardMate"
          >
            <BrandMark className="admin-brand-mark" size={40} />
            <div>
              <BrandWordmark subtitle="Dịch vụ công dân" compact />
            </div>
          </Link>
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

          {/* Nhóm 2: Hồ sơ & Chuẩn bị */}
          <div className="admin-nav-section">
            <p>Hồ sơ & Chuẩn bị</p>

            {/* Mục cha: Hồ sơ của tôi */}
            <button
              type="button"
              className={`admin-nav-parent ${isDossierSection ? 'is-active' : ''}`}
              onClick={() => setIsDossiersExpanded((prev) => !prev)}
              title={sidebarCollapsed ? 'Hồ sơ của tôi' : undefined}
              aria-expanded={isDossiersExpanded}
            >
              <Folder size={20} aria-hidden="true" weight={isDossierSection ? 'fill' : 'regular'} />
              <span>Hồ sơ của tôi</span>
              {dossierCounts.all > 0 && <small>{dossierCounts.all}</small>}
              {!sidebarCollapsed && (
                <CaretDown
                  size={14}
                  className={`text-slate-400 transition-transform duration-200 shrink-0 ${
                    isDossiersExpanded ? '' : '-rotate-90'
                  }`}
                />
              )}
            </button>

            {/* Các nhánh con của Hồ sơ của tôi */}
            {(isDossiersExpanded || sidebarCollapsed) && (
              <div className="admin-subnav-tree">
                <button
                  type="button"
                  className={`admin-subnav-btn ${activeSection === 'dossiers_all' ? 'is-active' : ''}`}
                  onClick={() => selectSection('dossiers_all')}
                  title={sidebarCollapsed ? 'Tất cả hồ sơ' : undefined}
                >
                  <List size={16} aria-hidden="true" />
                  <span>Tất cả hồ sơ</span>
                  {dossierCounts.all > 0 && <small>{dossierCounts.all}</small>}
                </button>

                <button
                  type="button"
                  className={`admin-subnav-btn ${activeSection === 'dossiers_draft' ? 'is-active' : ''}`}
                  onClick={() => selectSection('dossiers_draft')}
                  title={sidebarCollapsed ? 'Bản nháp' : undefined}
                >
                  <FileDashed size={16} aria-hidden="true" />
                  <span>Bản nháp</span>
                  {dossierCounts.draft > 0 && <small>{dossierCounts.draft}</small>}
                </button>

                <button
                  type="button"
                  className={`admin-subnav-btn ${activeSection === 'dossiers_pending' ? 'is-active' : ''}`}
                  onClick={() => selectSection('dossiers_pending')}
                  title={sidebarCollapsed ? 'Chờ tiền kiểm' : undefined}
                >
                  <Clock size={16} aria-hidden="true" className="text-sky-600" />
                  <span>Chờ tiền kiểm</span>
                  {dossierCounts.pending > 0 && (
                    <small className="!bg-sky-100 !text-sky-800">{dossierCounts.pending}</small>
                  )}
                </button>

                <button
                  type="button"
                  className={`admin-subnav-btn ${activeSection === 'dossiers_need_revision' ? 'is-active' : ''}`}
                  onClick={() => selectSection('dossiers_need_revision')}
                  title={sidebarCollapsed ? 'Cần chỉnh sửa' : undefined}
                >
                  <WarningCircle size={16} aria-hidden="true" className="text-amber-600" />
                  <span>Cần chỉnh sửa</span>
                  {dossierCounts.need_revision > 0 && (
                    <small className="!bg-amber-100 !text-amber-800">{dossierCounts.need_revision}</small>
                  )}
                </button>

                <button
                  type="button"
                  className={`admin-subnav-btn ${activeSection === 'dossiers_resubmitted' ? 'is-active' : ''}`}
                  onClick={() => selectSection('dossiers_resubmitted')}
                  title={sidebarCollapsed ? 'Đã gửi lại' : undefined}
                >
                  <ArrowClockwise size={16} aria-hidden="true" className="text-indigo-600" />
                  <span>Đã gửi lại</span>
                  {dossierCounts.resubmitted > 0 && (
                    <small className="!bg-indigo-100 !text-indigo-800">{dossierCounts.resubmitted}</small>
                  )}
                </button>

                <button
                  type="button"
                  className={`admin-subnav-btn ${activeSection === 'dossiers_approved' ? 'is-active' : ''}`}
                  onClick={() => selectSection('dossiers_approved')}
                  title={sidebarCollapsed ? 'Đã duyệt' : undefined}
                >
                  <CheckCircle size={16} aria-hidden="true" className="text-emerald-600" />
                  <span>Đã duyệt</span>
                  {dossierCounts.approved > 0 && (
                    <small className="!bg-emerald-100 !text-emerald-800">{dossierCounts.approved}</small>
                  )}
                </button>

                <button
                  type="button"
                  className={`admin-subnav-btn ${activeSection === 'dossiers_completed' ? 'is-active' : ''}`}
                  onClick={() => selectSection('dossiers_completed')}
                  title={sidebarCollapsed ? 'Đã hoàn thành' : undefined}
                >
                  <SealCheck size={16} aria-hidden="true" className="text-teal-600" />
                  <span>Đã hoàn thành</span>
                  {dossierCounts.completed > 0 && (
                    <small className="!bg-teal-100 !text-teal-800">{dossierCounts.completed}</small>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Nhóm 3: Tiện ích & Cài đặt */}
          <div className="admin-nav-section">
            <p>Tiện ích & Cài đặt</p>
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
          </div>
        </nav>
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

            <UserDropdown />
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
              onOpenDossierDetail={(dossier) => {
                // Nếu hồ sơ chưa có checklist thì thử tìm trong mockPublicProcedures
                if (!dossier.checklist || dossier.checklist.length === 0) {
                  const matchProc = mockPublicProcedures.find(
                    (p) =>
                      p.title.toLowerCase() === dossier.procedureName.toLowerCase() ||
                      dossier.procedureName.toLowerCase().includes(p.title.toLowerCase()) ||
                      p.title.toLowerCase().includes(dossier.procedureName.toLowerCase()) ||
                      p.id === dossier.procedureId
                  );
                  if (matchProc) {
                    const parsed = parseProcedureContent(matchProc.content_payload, matchProc.checklist_schema);
                    dossier.cases = parsed.content.cases;
                    dossier.checklist = parsed.content.checklist;
                  }
                }
                setSelectedDossierDetail(dossier);
                setActiveSection('dossier_detail');
                setSearchParams({ section: 'dossier_detail', dossierCode: dossier.code });
              }}
            />
          )}

          {activeSection === 'dossier_detail' && selectedDossierDetail && (
            <CitizenDossierDetailView
              dossier={selectedDossierDetail}
              onBack={() => selectSection(selectedDossierDetail.status === 'Bản nháp' ? 'dossiers_draft' : 'dossiers_all')}
              onSubmitPrecheck={() => {
                handleUpdateDossierStatus(selectedDossierDetail.code, 'Chờ tiền kiểm');
                setSelectedDossierDetail((prev) => prev ? { ...prev, status: 'Chờ tiền kiểm' } : null);
                toast.success(`Hồ sơ ${selectedDossierDetail.code} đã được nộp tiền kiểm trực tuyến thành công! Cán bộ sẽ sớm phản hồi.`);
              }}
              onDownloadForm={(item) => {
                toast.success(`Đang tải mẫu văn bản: ${item.itemName} (${item.templateFormat || 'DOCX'})`);
              }}
              onPreviewForm={(item) => {
                setPreviewFormItem({ item, procedureName: selectedDossierDetail.procedureName });
              }}
              onEditForm={(item) => {
                setEditFormItem({ item, procedureName: selectedDossierDetail.procedureName });
              }}
            />
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
            <CitizenProfileView
              initialProfile={userProfile}
              loading={profileLoading}
              onProfileUpdated={refetchProfile}
            />
          )}
        </main>
      </div>

      {/* Modal Xem trước biểu mẫu FormPreviewModal */}
      {previewFormItem && (
        <FormPreviewModal
          open={!!previewFormItem}
          onClose={() => setPreviewFormItem(null)}
          item={previewFormItem.item}
          procedureName={previewFormItem.procedureName}
          onOpenEdit={(item) => {
            setEditFormItem({ item, procedureName: previewFormItem.procedureName });
          }}
        />
      )}

      {/* Modal Soạn thảo biểu mẫu FormDocxEditorModal (tham khảo editdocx.net) */}
      {editFormItem && (
        <FormDocxEditorModal
          open={!!editFormItem}
          onClose={() => setEditFormItem(null)}
          item={editFormItem.item}
          procedureName={editFormItem.procedureName}
          userProfile={userProfile}
        />
      )}

      {/* Modal Đánh giá dịch vụ */}
      <CitizenFeedbackModal
        open={isFeedbackModalOpen}
        onOpenChange={setIsFeedbackModalOpen}
        procedureName={selectedFeedbackDossier.procedure}
        applicationCode={selectedFeedbackDossier.code}
        onSubmitFeedback={handleSubmitFeedback}
      />
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
    { id: 'dossiers_draft' as CitizenSectionId, title: 'Hồ sơ bản nháp', desc: 'Tiếp tục hoàn thiện hồ sơ', icon: NotePencil },
    { id: 'dossiers_all' as CitizenSectionId, title: 'Hồ sơ của tôi', desc: 'Theo dõi tiến độ tiền kiểm', icon: Folder },
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
                      toast.info(`Bắt đầu làm hồ sơ: ${item.name}. Vui lòng tạo bản nháp hoặc chọn hồ sơ trong danh sách.`);
                      onSelectSection('dossiers_all');
                    }}
                  >
                    Bắt đầu làm hồ sơ
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
  onOpenDossierDetail,
}: {
  activeSection: CitizenSectionId;
  dossiers: CitizenDossier[];
  onOpenFeedback: (procedure: string, code?: string) => void;
  onSelectSection: (id: CitizenSectionId) => void;
  onOpenDossierDetail: (dossier: CitizenDossier) => void;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedField, setSelectedField] = useState('all');

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
      const matchField = selectedField === 'all' || d.field === selectedField;
      const matchSearch =
        d.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.procedureName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.field.toLowerCase().includes(searchTerm.toLowerCase());
      return matchStatus && matchField && matchSearch;
    });
  }, [dossiers, targetStatus, selectedField, searchTerm]);

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
          <select
            className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none hover:border-slate-300"
            value={selectedField}
            onChange={(e) => setSelectedField(e.target.value)}
          >
            <option value="all">Tất cả lĩnh vực</option>
            <option value="Hộ tịch">Hộ tịch</option>
            <option value="Chứng thực">Chứng thực</option>
            <option value="Địa chính">Địa chính</option>
          </select>
          <button
            type="button"
            onClick={() => toast.info('Đang hiển thị danh sách hồ sơ theo bộ lọc')}
          >
            <Funnel size={16} /> Lọc
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
                <td className="max-w-[320px]">
                  <p className="text-xs text-slate-700 leading-relaxed line-clamp-2" title={item.officerNote}>
                    {item.officerNote || '—'}
                  </p>
                  {item.officerName && (
                    <small className="block text-[10px] text-slate-400 mt-0.5 truncate">Cán bộ: {item.officerName}</small>
                  )}
                </td>
                <td className="whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1.5">
                    {/* Nút Xem chi tiết hồ sơ */}
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-red-800 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition-all hover:bg-red-900 active:scale-95"
                      onClick={() => onOpenDossierDetail(item)}
                      title="Xem chi tiết hồ sơ và danh mục giấy tờ cần chuẩn bị"
                    >
                      <Eye size={14} weight="bold" />
                      <span>Chi tiết</span>
                    </button>

                    {item.status === 'Cần chỉnh sửa' && (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-800 transition-all hover:bg-amber-100 active:scale-95"
                        onClick={() => toast.info(`Mở giao diện bổ sung giấy tờ cho hồ sơ ${item.code}`)}
                        title="Bổ sung / Chỉnh sửa hồ sơ"
                      >
                        <NotePencil size={14} weight="bold" />
                        <span>Chỉnh sửa</span>
                      </button>
                    )}

                    {item.status === 'Đã hoàn thành' && (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 transition-all hover:bg-emerald-100 active:scale-95"
                        onClick={() => onOpenFeedback(item.procedureName, item.code)}
                        title="Đánh giá dịch vụ"
                      >
                        <Star size={14} weight="bold" />
                        <span>Đánh giá</span>
                      </button>
                    )}

                    {/* Nút Xem mã QR */}
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-800 active:scale-95"
                      onClick={() => onSelectSection('qr_code')}
                      title="Xem mã QR hồ sơ"
                    >
                      <QrCode size={14} weight="bold" />
                      <span>Mã QR</span>
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
// 3.1. CHI TIẾT HỒ SƠ & CHECKLIST CHUẨN BỊ (TRANG RIÊNG)
// ----------------------------------------------------------------------
function CitizenDossierDetailView({
  dossier,
  onBack,
  onSubmitPrecheck,
  onDownloadForm,
  onPreviewForm,
  onEditForm,
}: {
  dossier: CitizenDossier;
  onBack: () => void;
  onSubmitPrecheck: () => void;
  onDownloadForm: (item: ChecklistItem) => void;
  onPreviewForm: (item: ChecklistItem) => void;
  onEditForm: (item: ChecklistItem) => void;
}) {
  return (
    <div className="space-y-6 admin-content-card">
      {/* Thanh điều hướng quay lại & Thông tin tổng quát */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-red-900 transition-colors shadow-2xs"
            >
              <ArrowLeft size={16} weight="bold" />
              <span>Quay lại danh sách</span>
            </button>
            <div className="h-4 w-px bg-slate-200" />
            <span className="rounded-md bg-red-100 px-2.5 py-1 text-xs font-bold text-red-900">
              Mã: {dossier.code}
            </span>
            <span className={`admin-status-badge ${getStatusBadgeClass(dossier.status)}`}>
              {dossier.status}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {dossier.status === 'Bản nháp' && (
              <button
                type="button"
                onClick={onSubmitPrecheck}
                className="inline-flex items-center gap-2 rounded-xl bg-red-800 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-red-900 transition-all active:scale-[0.98]"
              >
                <CheckCircle size={16} weight="bold" />
                <span>Nộp tiền kiểm ngay</span>
              </button>
            )}
          </div>
        </div>

        <div className="mt-5">
          <span className="inline-block rounded-md bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 mb-1">
            Lĩnh vực: {dossier.field}
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
            {dossier.procedureName}
          </h2>
          <div className="mt-3 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-slate-500">
            <span>Ngày khởi tạo: <strong className="text-slate-700">{dossier.createdAt}</strong></span>
            <span>Cập nhật gần nhất: <strong className="text-slate-700">{dossier.updatedAt}</strong></span>
            {dossier.officerName && (
              <span>Cán bộ phụ trách: <strong className="text-slate-700">{dossier.officerName}</strong></span>
            )}
          </div>
        </div>

        {dossier.officerNote && (
          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-xs leading-relaxed text-amber-950 flex items-start gap-2.5">
            <span className="shrink-0 mt-0.5 font-bold text-amber-800">📌 Ghi chú cán bộ:</span>
            <span>{dossier.officerNote}</span>
          </div>
        )}
      </section>

      {/* Danh mục thành phần hồ sơ và biểu mẫu */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-slate-900">
            Danh mục giấy tờ & biểu mẫu
          </h3>
        </div>

        <DossierChecklistView
          procedureName={dossier.procedureName}
          cases={dossier.cases || []}
          checklist={dossier.checklist || []}
          dossierCode={dossier.code}
          onDownloadForm={onDownloadForm}
          onPreviewForm={onPreviewForm}
          onEditForm={onEditForm}
        />
      </section>

      {/* Thanh hành động chân trang */}
      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onBack}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs"
        >
          Quay lại danh sách
        </button>
        {dossier.status === 'Bản nháp' && (
          <button
            type="button"
            onClick={onSubmitPrecheck}
            className="rounded-xl bg-red-800 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-red-900 transition-all active:scale-[0.98]"
          >
            Nộp tiền kiểm ngay
          </button>
        )}
      </section>
    </div>
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
function CitizenProfileView({
  initialProfile,
  loading,
  onProfileUpdated,
}: {
  initialProfile: UserProfileDto | null;
  loading: boolean;
  onProfileUpdated?: () => void;
}) {
  const [formData, setFormData] = useState({
    fullName: initialProfile?.fullName || '',
    identityNumber: initialProfile?.identityNumber || '',
    dateOfBirth: initialProfile?.dateOfBirth || '',
    gender: initialProfile?.gender || '',
    phoneNumber: initialProfile?.phoneNumber || '',
    permanentAddress: initialProfile?.permanentAddress || '',
    temporaryAddress: initialProfile?.temporaryAddress || '',
  });

  const [errors, setErrors] = useState<ProfileFieldErrors>({});
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialProfile) {
      setFormData({
        fullName: initialProfile.fullName || '',
        identityNumber: initialProfile.identityNumber || '',
        dateOfBirth: initialProfile.dateOfBirth || '',
        gender: initialProfile.gender || '',
        phoneNumber: initialProfile.phoneNumber || '',
        permanentAddress: initialProfile.permanentAddress || '',
        temporaryAddress: initialProfile.temporaryAddress || '',
      });
      setErrors({});
    }
  }, [initialProfile]);

  function handleChange(field: keyof typeof formData, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }

  function handleCancel() {
    if (initialProfile) {
      setFormData({
        fullName: initialProfile.fullName || '',
        identityNumber: initialProfile.identityNumber || '',
        dateOfBirth: initialProfile.dateOfBirth || '',
        gender: initialProfile.gender || '',
        phoneNumber: initialProfile.phoneNumber || '',
        permanentAddress: initialProfile.permanentAddress || '',
        temporaryAddress: initialProfile.temporaryAddress || '',
      });
    }
    setErrors({});
    setIsEditing(false);
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();

    // 1. Client-side validation chặt chẽ bằng Zod schema
    const validation = validateProfile(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      const firstErrorField = Object.keys(validation.errors)[0];
      if (firstErrorField) {
        document.getElementById(`profile-${firstErrorField}`)?.focus();
      }
      toast.error('Vui lòng kiểm tra lại các trường thông tin chưa hợp lệ.');
      return;
    }

    setSaving(true);
    try {
      // 2. Chuẩn hóa payload trước khi gửi lên API
      const normalizedPayload = {
        fullName: formData.fullName.trim().replace(/\s+/g, ' '),
        identityNumber: formData.identityNumber?.trim() || null,
        phoneNumber: formData.phoneNumber?.replace(/[\s.-]/g, '').trim() || null,
        dateOfBirth: formData.dateOfBirth?.trim() || null,
        gender: formData.gender?.trim() || null,
        permanentAddress: formData.permanentAddress?.trim() || null,
        temporaryAddress: formData.temporaryAddress?.trim() || null,
      };

      await updateMyProfile(normalizedPayload);
      toast.success('Đã cập nhật thông tin hồ sơ thành công.');
      setErrors({});
      setIsEditing(false);
      onProfileUpdated?.();
    } catch (error) {
      // 3. Xử lý lỗi server validation (ProblemDetails 400 errors) nếu có
      if (axios.isAxiosError(error) && error.response?.data?.errors) {
        const serverErrors = error.response.data.errors as Record<string, string[]>;
        const newErrors: ProfileFieldErrors = {};
        for (const [key, msgs] of Object.entries(serverErrors)) {
          const lower = key.toLowerCase();
          const msg = Array.isArray(msgs) ? msgs[0] : String(msgs);
          if (lower === 'fullname') newErrors.fullName = msg;
          else if (lower === 'identitynumber') newErrors.identityNumber = msg;
          else if (lower === 'phonenumber') newErrors.phoneNumber = msg;
          else if (lower === 'dateofbirth') newErrors.dateOfBirth = msg;
          else if (lower === 'gender') newErrors.gender = msg;
          else if (lower === 'permanentaddress') newErrors.permanentAddress = msg;
          else if (lower === 'temporaryaddress') newErrors.temporaryAddress = msg;
        }
        if (Object.keys(newErrors).length > 0) {
          setErrors(newErrors);
          const firstKey = Object.keys(newErrors)[0];
          document.getElementById(`profile-${firstKey}`)?.focus();
        }
      }
      toast.error(authErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  const initials = formData.fullName.trim()
    ? formData.fullName.trim().split(/\s+/).slice(-2).map(w => w[0]).join('').toUpperCase()
    : 'CD';

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-5 admin-content-card">
      <section className="admin-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-4">
            <span className="grid size-14 place-items-center rounded-2xl bg-red-800 text-lg font-bold text-white shadow-sm">
              {initials}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-950">
                  {loading ? 'Đang tải...' : formData.fullName || 'Công dân chưa cập nhật tên'}
                </h2>
                <span className="admin-status-badge is-success">Đã định danh điện tử</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Số định danh cá nhân / CCCD: {formData.identityNumber || 'Chưa liên kết'}
              </p>
            </div>
          </div>

          <button
            type="button"
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 hover:bg-slate-50"
            onClick={() => {
              if (isEditing) {
                handleCancel();
              } else {
                setIsEditing(true);
              }
            }}
            disabled={saving}
          >
            <NotePencil size={16} /> {isEditing ? 'Hủy chỉnh sửa' : 'Chỉnh sửa thông tin'}
          </button>
        </div>

        <form onSubmit={handleSaveProfile} noValidate className="mt-6 grid gap-5 sm:grid-cols-2">
          {/* Họ và tên */}
          <div>
            <label htmlFor="profile-fullName" className="block text-xs font-bold text-slate-700">
              Họ và tên <span className="text-red-600">*</span>
            </label>
            <input
              id="profile-fullName"
              name="fullName"
              type="text"
              value={formData.fullName}
              disabled={!isEditing || saving}
              onChange={(e) => handleChange('fullName', e.target.value)}
              placeholder="Ví dụ: Nguyễn Văn An"
              maxLength={100}
              aria-invalid={!!errors.fullName}
              aria-describedby={errors.fullName ? 'profile-fullName-error' : undefined}
              className={`mt-1.5 h-11 w-full rounded-lg border px-3.5 text-xs font-medium text-slate-900 transition-colors disabled:opacity-75 focus:outline-none focus:ring-2 ${
                errors.fullName
                  ? 'border-red-500 bg-red-50/20 focus:border-red-600 focus:ring-red-500/20'
                  : 'border-slate-200 bg-slate-50 focus:bg-white focus:ring-red-500'
              }`}
              required
            />
            {errors.fullName && (
              <p id="profile-fullName-error" role="alert" className="mt-1.5 text-xs font-semibold text-red-600">
                {errors.fullName}
              </p>
            )}
          </div>

          {/* Số CCCD / Mã định danh */}
          <div>
            <label htmlFor="profile-identityNumber" className="block text-xs font-bold text-slate-700">
              Số CCCD / Mã định danh cá nhân
            </label>
            <input
              id="profile-identityNumber"
              name="identityNumber"
              type="text"
              value={formData.identityNumber}
              disabled={!isEditing || saving}
              onChange={(e) => handleChange('identityNumber', e.target.value)}
              placeholder="Gồm đúng 12 chữ số"
              maxLength={12}
              aria-invalid={!!errors.identityNumber}
              aria-describedby={errors.identityNumber ? 'profile-identityNumber-error' : undefined}
              className={`mt-1.5 h-11 w-full rounded-lg border px-3.5 text-xs font-medium text-slate-900 transition-colors disabled:opacity-75 focus:outline-none focus:ring-2 ${
                errors.identityNumber
                  ? 'border-red-500 bg-red-50/20 focus:border-red-600 focus:ring-red-500/20'
                  : 'border-slate-200 bg-slate-50 focus:bg-white focus:ring-red-500'
              }`}
            />
            {errors.identityNumber && (
              <p id="profile-identityNumber-error" role="alert" className="mt-1.5 text-xs font-semibold text-red-600">
                {errors.identityNumber}
              </p>
            )}
          </div>

          {/* Ngày sinh */}
          <div>
            <label htmlFor="profile-dateOfBirth" className="block text-xs font-bold text-slate-700">
              Ngày sinh (YYYY-MM-DD)
            </label>
            <input
              id="profile-dateOfBirth"
              name="dateOfBirth"
              type="date"
              value={formData.dateOfBirth}
              disabled={!isEditing || saving}
              onChange={(e) => handleChange('dateOfBirth', e.target.value)}
              max={todayStr}
              min="1900-01-01"
              aria-invalid={!!errors.dateOfBirth}
              aria-describedby={errors.dateOfBirth ? 'profile-dateOfBirth-error' : undefined}
              className={`mt-1.5 h-11 w-full rounded-lg border px-3.5 text-xs font-medium text-slate-900 transition-colors disabled:opacity-75 focus:outline-none focus:ring-2 ${
                errors.dateOfBirth
                  ? 'border-red-500 bg-red-50/20 focus:border-red-600 focus:ring-red-500/20'
                  : 'border-slate-200 bg-slate-50 focus:bg-white focus:ring-red-500'
              }`}
            />
            {errors.dateOfBirth && (
              <p id="profile-dateOfBirth-error" role="alert" className="mt-1.5 text-xs font-semibold text-red-600">
                {errors.dateOfBirth}
              </p>
            )}
          </div>

          {/* Giới tính */}
          <div>
            <label htmlFor="profile-gender" className="block text-xs font-bold text-slate-700">
              Giới tính
            </label>
            <select
              id="profile-gender"
              name="gender"
              value={formData.gender}
              disabled={!isEditing || saving}
              onChange={(e) => handleChange('gender', e.target.value)}
              aria-invalid={!!errors.gender}
              aria-describedby={errors.gender ? 'profile-gender-error' : undefined}
              className={`mt-1.5 h-11 w-full rounded-lg border px-3.5 text-xs font-medium text-slate-900 transition-colors disabled:opacity-75 focus:outline-none focus:ring-2 ${
                errors.gender
                  ? 'border-red-500 bg-red-50/20 focus:border-red-600 focus:ring-red-500/20'
                  : 'border-slate-200 bg-slate-50 focus:bg-white focus:ring-red-500'
              }`}
            >
              <option value="">Chọn giới tính</option>
              <option value="Nam">Nam</option>
              <option value="Nữ">Nữ</option>
              <option value="Khác">Khác</option>
            </select>
            {errors.gender && (
              <p id="profile-gender-error" role="alert" className="mt-1.5 text-xs font-semibold text-red-600">
                {errors.gender}
              </p>
            )}
          </div>

          {/* Số điện thoại liên hệ */}
          <div>
            <label htmlFor="profile-phoneNumber" className="block text-xs font-bold text-slate-700">
              Số điện thoại di động
            </label>
            <input
              id="profile-phoneNumber"
              name="phoneNumber"
              type="tel"
              value={formData.phoneNumber}
              disabled={!isEditing || saving}
              onChange={(e) => handleChange('phoneNumber', e.target.value)}
              placeholder="Ví dụ: 0912345678"
              maxLength={15}
              aria-invalid={!!errors.phoneNumber}
              aria-describedby={errors.phoneNumber ? 'profile-phoneNumber-error' : undefined}
              className={`mt-1.5 h-11 w-full rounded-lg border px-3.5 text-xs font-medium text-slate-900 transition-colors disabled:opacity-75 focus:outline-none focus:ring-2 ${
                errors.phoneNumber
                  ? 'border-red-500 bg-red-50/20 focus:border-red-600 focus:ring-red-500/20'
                  : 'border-slate-200 bg-slate-50 focus:bg-white focus:ring-red-500'
              }`}
            />
            {errors.phoneNumber && (
              <p id="profile-phoneNumber-error" role="alert" className="mt-1.5 text-xs font-semibold text-red-600">
                {errors.phoneNumber}
              </p>
            )}
          </div>

          {/* Địa chỉ tạm trú */}
          <div>
            <label htmlFor="profile-temporaryAddress" className="block text-xs font-bold text-slate-700">
              Địa chỉ tạm trú
            </label>
            <input
              id="profile-temporaryAddress"
              name="temporaryAddress"
              type="text"
              value={formData.temporaryAddress}
              disabled={!isEditing || saving}
              onChange={(e) => handleChange('temporaryAddress', e.target.value)}
              placeholder="Nhập địa chỉ tạm trú (nếu có)"
              maxLength={255}
              aria-invalid={!!errors.temporaryAddress}
              aria-describedby={errors.temporaryAddress ? 'profile-temporaryAddress-error' : undefined}
              className={`mt-1.5 h-11 w-full rounded-lg border px-3.5 text-xs font-medium text-slate-900 transition-colors disabled:opacity-75 focus:outline-none focus:ring-2 ${
                errors.temporaryAddress
                  ? 'border-red-500 bg-red-50/20 focus:border-red-600 focus:ring-red-500/20'
                  : 'border-slate-200 bg-slate-50 focus:bg-white focus:ring-red-500'
              }`}
            />
            {errors.temporaryAddress && (
              <p id="profile-temporaryAddress-error" role="alert" className="mt-1.5 text-xs font-semibold text-red-600">
                {errors.temporaryAddress}
              </p>
            )}
          </div>

          {/* Nơi thường trú */}
          <div className="sm:col-span-2">
            <label htmlFor="profile-permanentAddress" className="block text-xs font-bold text-slate-700">
              Nơi thường trú
            </label>
            <input
              id="profile-permanentAddress"
              name="permanentAddress"
              type="text"
              value={formData.permanentAddress}
              disabled={!isEditing || saving}
              onChange={(e) => handleChange('permanentAddress', e.target.value)}
              placeholder="Số nhà, tên đường, tổ/thôn, phường/xã, quận/huyện, tỉnh/thành phố"
              maxLength={255}
              aria-invalid={!!errors.permanentAddress}
              aria-describedby={errors.permanentAddress ? 'profile-permanentAddress-error' : undefined}
              className={`mt-1.5 h-11 w-full rounded-lg border px-3.5 text-xs font-medium text-slate-900 transition-colors disabled:opacity-75 focus:outline-none focus:ring-2 ${
                errors.permanentAddress
                  ? 'border-red-500 bg-red-50/20 focus:border-red-600 focus:ring-red-500/20'
                  : 'border-slate-200 bg-slate-50 focus:bg-white focus:ring-red-500'
              }`}
            />
            {errors.permanentAddress && (
              <p id="profile-permanentAddress-error" role="alert" className="mt-1.5 text-xs font-semibold text-red-600">
                {errors.permanentAddress}
              </p>
            )}
          </div>

          {isEditing && (
            <div className="sm:col-span-2 flex justify-end gap-3 mt-2">
              <button
                type="button"
                className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                onClick={handleCancel}
                disabled={saving}
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="rounded-lg bg-red-800 px-5 py-2 text-xs font-bold text-white hover:bg-red-900 shadow-sm disabled:opacity-60 transition-colors"
                disabled={saving}
              >
                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
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
