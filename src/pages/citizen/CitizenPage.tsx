import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useUserProfile } from '@/hooks/useUserProfile';
import { UserDropdown } from '@/components/layout/UserDropdown';
import { BrandMark } from '@/components/brand/BrandMark';
import { BrandWordmark } from '@/components/brand/BrandWordmark';
import { toast } from '@/components/ui/Toast';
import { CitizenFeedbackModal } from '@/components/feedback/CitizenFeedbackModal';
import type { CitizenFeedback } from '@/types/feedback';
import type { ChecklistItem } from '@/lib/procedureContent';
import { ProceduresPage } from '@/pages/public/ProceduresPage';
import { FormDocxEditorModal } from './components/FormDocxEditorModal';
import { FormPreviewModal } from './components/FormPreviewModal';

// Icons
import {
  Bell,
  CaretDown,
  CaretRight,
  Folder,
  House,
  List,
  MagnifyingGlass,
  Plus,
  QrCode,
  SidebarSimple,
  Star,
  User,
  X,
} from '@phosphor-icons/react';

// Types & Views
import type { CitizenDossier, CitizenSectionId } from './types';
import { initialDossiers, citizenNotifications } from './types';
import { CitizenDashboardView } from './views/CitizenDashboardView';
import { CitizenDossiersView } from './views/CitizenDossiersView';
import { CitizenDossierDetailView } from './views/CitizenDossierDetailView';
import { CitizenNotificationsView } from './views/CitizenNotificationsView';
import { CitizenQrCodeView } from './views/CitizenQrCodeView';
import { CitizenFeedbackView } from './views/CitizenFeedbackView';
import { CitizenProfileView } from './views/CitizenProfileView';

// Re-export types for backward compatibility
export type { CitizenSectionId, CitizenDossier } from './types';
export { initialDossiers } from './types';

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

  // Expandable sections in sidebar
  const [isDossiersExpanded, setIsDossiersExpanded] = useState(true);

  // Khởi tạo dossiers kết hợp localStorage
  const [dossiers, setDossiers] = useState<CitizenDossier[]>(() => {
    try {
      const stored = localStorage.getItem('wardmate_citizen_drafts');
      if (stored) {
        const parsedDrafts: CitizenDossier[] = JSON.parse(stored);
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
                  title={sidebarCollapsed ? 'Hồ sơ bản nháp' : undefined}
                >
                  <span>Bản nháp</span>
                  {dossierCounts.draft > 0 && <small>{dossierCounts.draft}</small>}
                </button>

                <button
                  type="button"
                  className={`admin-subnav-btn ${activeSection === 'dossiers_pending' ? 'is-active' : ''}`}
                  onClick={() => selectSection('dossiers_pending')}
                  title={sidebarCollapsed ? 'Chờ tiền kiểm' : undefined}
                >
                  <span>Chờ tiền kiểm</span>
                  {dossierCounts.pending > 0 && <small>{dossierCounts.pending}</small>}
                </button>

                <button
                  type="button"
                  className={`admin-subnav-btn ${activeSection === 'dossiers_need_revision' ? 'is-active' : ''}`}
                  onClick={() => selectSection('dossiers_need_revision')}
                  title={sidebarCollapsed ? 'Cần chỉnh sửa' : undefined}
                >
                  <span>Cần chỉnh sửa</span>
                  {dossierCounts.need_revision > 0 && <small className="is-warning">{dossierCounts.need_revision}</small>}
                </button>

                <button
                  type="button"
                  className={`admin-subnav-btn ${activeSection === 'dossiers_resubmitted' ? 'is-active' : ''}`}
                  onClick={() => selectSection('dossiers_resubmitted')}
                  title={sidebarCollapsed ? 'Đã gửi lại' : undefined}
                >
                  <span>Đã gửi lại</span>
                  {dossierCounts.resubmitted > 0 && <small>{dossierCounts.resubmitted}</small>}
                </button>

                <button
                  type="button"
                  className={`admin-subnav-btn ${activeSection === 'dossiers_approved' ? 'is-active' : ''}`}
                  onClick={() => selectSection('dossiers_approved')}
                  title={sidebarCollapsed ? 'Đã duyệt tiền kiểm' : undefined}
                >
                  <span>Đã duyệt tiền kiểm</span>
                  {dossierCounts.approved > 0 && <small className="is-success">{dossierCounts.approved}</small>}
                </button>

                <button
                  type="button"
                  className={`admin-subnav-btn ${activeSection === 'dossiers_completed' ? 'is-active' : ''}`}
                  onClick={() => selectSection('dossiers_completed')}
                  title={sidebarCollapsed ? 'Đã hoàn thành' : undefined}
                >
                  <span>Đã hoàn thành</span>
                  {dossierCounts.completed > 0 && <small className="is-success">{dossierCounts.completed}</small>}
                </button>
              </div>
            )}
          </div>

          {/* Nhóm 3: Tiện ích & Hỗ trợ */}
          <div className="admin-nav-section">
            <p>Tiện ích & Hỗ trợ</p>
            <button
              type="button"
              className={activeSection === 'notifications' ? 'is-active' : ''}
              aria-current={activeSection === 'notifications' ? 'page' : undefined}
              onClick={() => selectSection('notifications')}
              title={sidebarCollapsed ? 'Thông báo' : undefined}
            >
              <Bell size={20} aria-hidden="true" />
              <span>Thông báo</span>
              {unreadNotificationsCount > 0 && <small className="is-danger">{unreadNotificationsCount}</small>}
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
            <ProceduresPage />
          )}

          {isDossierSection && (
            <CitizenDossiersView
              activeSection={activeSection}
              dossiers={dossiers}
              onOpenFeedback={handleOpenFeedback}
              onSelectSection={selectSection}
              onOpenDossierDetail={(dossier) => {
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
                toast.info('Đã đánh dấu đã đọc tất cả thông báo.');
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

      {/* Modal Xem trước phôi mẫu DOCX/Biểu mẫu */}
      {previewFormItem && (
        <FormPreviewModal
          open={!!previewFormItem}
          onClose={() => setPreviewFormItem(null)}
          item={previewFormItem.item}
          procedureName={previewFormItem.procedureName}
        />
      )}

      {/* Modal Trình Soạn thảo Biểu mẫu A4 trực tuyến */}
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
