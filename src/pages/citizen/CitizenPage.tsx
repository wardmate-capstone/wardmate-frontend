import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useUserProfile } from '@/hooks/useUserProfile';
import { UserDropdown } from '@/components/layout/UserDropdown';
import { WorkspaceSidebar, type WorkspaceNavGroup } from '@/components/layout/WorkspaceSidebar';
import { toast } from '@/components/ui/Toast';
import { CitizenFeedbackModal } from '@/components/feedback/CitizenFeedbackModal';
import type { CitizenFeedback } from '@/types/feedback';
import type { ChecklistItem } from '@/lib/procedureContent';
import { ProceduresPage } from '@/pages/public/ProceduresPage';
import { usePublicProcedureList } from '@/hooks/useProcedureCategories';
import { getPublicWards } from '@/lib/api';
import { FormDocxEditorModal } from './components/FormDocxEditorModal';
import { FormPreviewModal } from './components/FormPreviewModal';
import {
  useCitizenApplications,
  useSubmitApplicationMutation,
  useResubmitApplicationMutation,
  useCreateApplicationMutation,
  workflowQueryKeys,
} from '@/hooks/useWorkflow';
import { workflowApi, workflowError } from '@/lib/api/workflow';
import { mapSummaryDtoToCitizenDossier, mapApplicationDtoToCitizenDossier } from '@/lib/api/workflowAdapters';
import { useQuery } from '@tanstack/react-query';

// Icons
import {
  ArrowCounterClockwise,
  Bell,
  CaretRight,
  CheckCircle,
  FileText,
  Files,
  House,
  Hourglass,
  List,
  Plus,
  QrCode,
  SidebarSimple,
  Star,
  UserCircle,
  WarningCircle,
  X,
} from '@phosphor-icons/react';

// Types & Views
import type { CitizenDossier, CitizenSectionId, CitizenNotification } from './types';
import { CitizenDashboardView } from './views/CitizenDashboardView';
import { CitizenDossiersView } from './views/CitizenDossiersView';
import { CitizenDossierDetailView } from './views/CitizenDossierDetailView';
import { CitizenNotificationsView } from './views/CitizenNotificationsView';
import { CitizenQrCodeView } from './views/CitizenQrCodeView';
import { CitizenFeedbackView } from './views/CitizenFeedbackView';
import { CitizenProfileView } from './views/CitizenProfileView';

// Re-export types for backward compatibility
export type { CitizenSectionId, CitizenDossier } from './types';

const sectionTitles: Record<CitizenSectionId, { title: string; subtitle?: string }> = {
  dashboard: { title: 'Tổng quan công dân' },
  procedures: { title: 'Tra cứu thủ tục' },
  dossiers_all: { title: 'Hồ sơ của tôi' },
  dossiers_draft: { title: 'Hồ sơ bản nháp' },
  dossiers_pending: { title: 'Hồ sơ chờ tiền kiểm' },
  dossiers_need_revision: { title: 'Hồ sơ cần chỉnh sửa' },
  dossiers_resubmitted: { title: 'Hồ sơ đã gửi lại' },
  dossiers_approved: { title: 'Hồ sơ đã duyệt tiền kiểm' },
  dossiers_completed: { title: 'Hồ sơ đã hoàn thành' },
  dossier_detail: { title: 'Chi tiết hồ sơ & Checklist chuẩn bị' },
  notifications: { title: 'Thông báo & Cập nhật' },
  qr_code: { title: 'Mã QR hồ sơ điện tử' },
  feedback: { title: 'Đánh giá dịch vụ & Sự hài lòng' },
  profile: { title: 'Hồ sơ cá nhân & Định danh' },
};

export function CitizenPage({ embedded = false, initialSection = 'dashboard' }: { embedded?: boolean; initialSection?: CitizenSectionId } = {}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlSection = searchParams.get('section') as CitizenSectionId | null;
  const urlDossierCode = searchParams.get('dossierCode');
  const queryClient = useQueryClient();

  const { profile: userProfile, loading: profileLoading, refetch: refetchProfile } = useUserProfile();
  const [activeSection, setActiveSection] = useState<CitizenSectionId>(() => embedded ? initialSection : urlSection || initialSection);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // TanStack Query: Lấy danh sách hồ sơ công dân từ backend
  const citizenAppsQuery = useCitizenApplications(1, 50);
  const submitMutation = useSubmitApplicationMutation();
  const resubmitMutation = useResubmitApplicationMutation();
  const createMutation = useCreateApplicationMutation();

  // Lấy danh sách thủ tục công khai từ Catalog để chọn khi tạo hồ sơ
  const proceduresQuery = usePublicProcedureList({ pageNumber: 1, pageSize: 50 });
  const availableProcedures = proceduresQuery.data?.items || [];

  // Lấy danh sách phường xã từ IAM
  const wardsQuery = useQuery({
    queryKey: ['wards', 'public'],
    queryFn: getPublicWards,
  });
  const availableWards = wardsQuery.data || [];

  const [submittingAction, setSubmittingAction] = useState(false);

  // Modal tạo hồ sơ mới
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedProcedureId, setSelectedProcedureId] = useState<string>('');
  const [newWardCode, setNewWardCode] = useState('PHUONG_BEN_NGHE');

  // Khởi tạo thủ tục mặc định khi danh sách thủ tục tải xong
  useEffect(() => {
    if (availableProcedures.length > 0 && !selectedProcedureId) {
      setSelectedProcedureId(availableProcedures[0].id);
    }
  }, [availableProcedures, selectedProcedureId]);

  // Khởi tạo phường mặc định khi danh sách phường tải xong
  useEffect(() => {
    if (availableWards.length > 0 && !availableWards.some((w) => w.code === newWardCode)) {
      setNewWardCode(availableWards[0].code);
    }
  }, [availableWards, newWardCode]);

  // Map API items sang CitizenDossier
  const dossiers: CitizenDossier[] = useMemo(() => {
    if (!citizenAppsQuery.data?.items) return [];
    return citizenAppsQuery.data.items.map(mapSummaryDtoToCitizenDossier);
  }, [citizenAppsQuery.data?.items]);

  // State Chi tiết hồ sơ đang chọn
  const [selectedDossierDetail, setSelectedDossierDetail] = useState<CitizenDossier | null>(null);

  // State Modal Preview Form và Editor Form
  const [previewFormItem, setPreviewFormItem] = useState<{ item: ChecklistItem; procedureName: string } | null>(null);
  const [editFormItem, setEditFormItem] = useState<{ item: ChecklistItem; procedureName: string } | null>(null);

  // Thông báo
  const [notifications, setNotifications] = useState<CitizenNotification[]>([]);
  // Feedback modal state
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [selectedFeedbackDossier, setSelectedFeedbackDossier] = useState<{ procedure: string; code?: string }>({
    procedure: 'Chứng thực bản sao từ bản chính',
    code: 'HS-2026-00094',
  });

  // Tải chi tiết đầy đủ của hồ sơ (checklist, form data) khi mở
  async function handleOpenDossierDetail(dossier: CitizenDossier) {
    setSelectedDossierDetail(dossier);
    setActiveSection('dossier_detail');
    setSearchParams({ section: 'dossier_detail', dossierCode: dossier.code });

    if (dossier.id) {
      try {
        const fullDto = await workflowApi.getApplication(dossier.id);
        const mapped = mapApplicationDtoToCitizenDossier(fullDto);
        setSelectedDossierDetail(mapped);
      } catch (err) {
        console.warn('Không thể tải chi tiết checklist đầy đủ:', err);
      }
    }
  }

  // Xử lý nộp tiền kiểm lần đầu
  async function handleSubmitPrecheck() {
    if (!selectedDossierDetail?.id) {
      toast.error('Không tìm thấy thông tin hồ sơ.');
      return;
    }
    try {
      setSubmittingAction(true);
      const updated = await submitMutation.mutateAsync(selectedDossierDetail.id);
      toast.success(`Hồ sơ ${updated.applicationCode} đã được nộp tiền kiểm trực tuyến thành công! Cán bộ sẽ sớm phản hồi.`);
      setSelectedDossierDetail(mapApplicationDtoToCitizenDossier(updated));
      queryClient.invalidateQueries({ queryKey: workflowQueryKeys.citizenApplications() });
    } catch (err) {
      const msg = workflowError(err);
      toast.error(`Không thể nộp tiền kiểm: ${msg}`);
    } finally {
      setSubmittingAction(false);
    }
  }

  // Xử lý nộp lại sau khi chỉnh sửa
  async function handleResubmitPrecheck() {
    if (!selectedDossierDetail?.id) {
      toast.error('Không tìm thấy thông tin hồ sơ.');
      return;
    }
    try {
      setSubmittingAction(true);
      const resubmitChecklists = (selectedDossierDetail.checklist || []).map((c) => ({
        id: c.checklistId,
        status: 'COMPLETED',
        fileUrl: null,
      }));

      const updated = await resubmitMutation.mutateAsync({
        id: selectedDossierDetail.id,
        input: {
          expectedVersionNumber: selectedDossierDetail.currentVersion || 1,
          formData: selectedDossierDetail.formData || {},
          checklists: resubmitChecklists,
        },
      });
      toast.success(`Đã gửi lại hồ sơ ${updated.application.applicationCode} (phiên bản v${updated.application.currentVersionNumber}) cho cán bộ thành công!`);
      setSelectedDossierDetail(mapApplicationDtoToCitizenDossier(updated.application));
      queryClient.invalidateQueries({ queryKey: workflowQueryKeys.citizenApplications() });
      queryClient.invalidateQueries({ queryKey: workflowQueryKeys.applicationComments(selectedDossierDetail.id) });
    } catch (err) {
      const msg = workflowError(err);
      toast.error(`Không thể gửi lại hồ sơ: ${msg}`);
    } finally {
      setSubmittingAction(false);
    }
  }

  // Cập nhật trạng thái mục checklist lên API
  async function handleUpdateChecklistItem(checklistId: string, status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED', fileName?: string) {
    if (!selectedDossierDetail?.id) return;
    try {
      await workflowApi.updateChecklist(selectedDossierDetail.id, checklistId, {
        status,
        fileUrl: fileName,
      });
      // Cập nhật local state
      setSelectedDossierDetail((prev) => {
        if (!prev || !prev.checklist) return prev;
        return {
          ...prev,
          checklist: prev.checklist.map((item) =>
            item.checklistId === checklistId
              ? { ...item, status, isCompleted: status === 'COMPLETED' }
              : item
          ),
        };
      });
    } catch (err) {
      console.warn('Lỗi cập nhật checklist item:', err);
    }
  }

  // Tạo mới hồ sơ nháp
  async function handleCreateDraft() {
    try {
      const targetProc = availableProcedures.find((p) => p.id === selectedProcedureId) || availableProcedures[0];
      if (!targetProc) {
        toast.error('Chưa có thủ tục hành chính nào được chọn.');
        return;
      }

      setSubmittingAction(true);
      const created = await createMutation.mutateAsync({
        procedureId: targetProc.id,
        wardCode: newWardCode,
        formData: {
          procedureTitle: targetProc.title,
          procedureCode: targetProc.procedureCode,
          applicantName: userProfile?.fullName || 'Công dân',
          identityNumber: userProfile?.identityNumber || '',
          phoneNumber: userProfile?.phoneNumber || '',
        },
      });

      toast.success(`Đã khởi tạo thành công hồ sơ tiền kiểm ${created.applicationCode}!`);
      setIsCreateModalOpen(false);
      queryClient.invalidateQueries({ queryKey: workflowQueryKeys.citizenApplications() });

      // Mở ngay chi tiết hồ sơ vừa tạo
      const mapped = mapApplicationDtoToCitizenDossier(created);
      setSelectedDossierDetail(mapped);
      setActiveSection('dossier_detail');
      setSearchParams({ section: 'dossier_detail', dossierCode: mapped.code });
    } catch (err) {
      const msg = workflowError(err);
      toast.error(`Không thể tạo hồ sơ: ${msg}`);
    } finally {
      setSubmittingAction(false);
    }
  }

  // Xử lý khi URL thay đổi
  useEffect(() => {
    if (urlSection && urlSection !== activeSection) {
      setActiveSection(urlSection);
    }
    if (urlDossierCode && dossiers.length > 0) {
      const found = dossiers.find((d) => d.code === urlDossierCode);
      if (found && (!selectedDossierDetail || selectedDossierDetail.code !== urlDossierCode)) {
        void handleOpenDossierDetail(found);
      }
    }
  }, [urlSection, urlDossierCode, dossiers]);

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

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

  function handleOpenFeedback(procedure: string, code?: string) {
    setSelectedFeedbackDossier({ procedure, code });
    setIsFeedbackModalOpen(true);
  }

  function handleSubmitFeedback(data: CitizenFeedback) {
    toast.success(`Cảm ơn bạn đã đánh giá dịch vụ ${data.rating} sao! Phản hồi đã được ghi nhận.`);
  }

  const isDossierSection = activeSection.startsWith('dossiers_');
  const citizenRole = ['REGISTERED_CITIZEN'];
  const citizenNavigation: WorkspaceNavGroup<CitizenSectionId>[] = [
    { title: 'Tổng quan', items: [
      { id: 'dashboard', label: 'Tổng quan', icon: House, permissions: ['document.submissions.'], fallbackRoles: citizenRole },
    ] },
    { title: 'Hồ sơ & Chuẩn bị', items: [
      { id: 'dossiers_all', label: 'Hồ sơ của tôi', icon: Files, children: [
        { id: 'dossiers_all', label: 'Tất cả hồ sơ', icon: Files, permissions: ['document.submissions.read', 'document.submissions.write', 'document.submissions.submit'] },
        { id: 'dossiers_draft', label: 'Bản nháp', icon: FileText, permissions: ['document.submissions.write'] },
        { id: 'dossiers_pending', label: 'Chờ tiền kiểm', icon: Hourglass, permissions: ['document.submissions.read'] },
        { id: 'dossiers_need_revision', label: 'Cần chỉnh sửa', icon: WarningCircle, permissions: ['document.submissions.write'] },
        { id: 'dossiers_resubmitted', label: 'Đã gửi lại', icon: ArrowCounterClockwise, permissions: ['document.submissions.read'] },
        { id: 'dossiers_approved', label: 'Đã duyệt tiền kiểm', icon: CheckCircle, permissions: ['document.submissions.read'] },
        { id: 'dossiers_completed', label: 'Đã hoàn thành', icon: FileText, permissions: ['document.submissions.read'] },
      ] },
    ] },
    { title: 'Tiện ích & Hỗ trợ', items: [
      { id: 'notifications', label: 'Thông báo', icon: Bell, fallbackRoles: citizenRole },
      { id: 'qr_code', label: 'Mã QR hồ sơ', icon: QrCode, fallbackRoles: citizenRole },
      { id: 'feedback', label: 'Đánh giá dịch vụ', icon: Star, fallbackRoles: citizenRole },
      { id: 'profile', label: 'Hồ sơ cá nhân', icon: UserCircle, permissions: ['iam.profile.read', 'iam.profile.write'] },
    ] },
  ];

  return (
    <div className={embedded ? "" : "admin-layout"}>
      {!embedded && <a href="#citizen-main" className="skip-link">
        Đến nội dung chính
      </a>}

      {!embedded && <WorkspaceSidebar workspace="citizen" subtitle="Dịch vụ công dân" activeSection={activeSection} groups={citizenNavigation} onSelectSection={selectSection} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} isCompact={sidebarCollapsed} />}


      {/* KHÔNG GIAN LÀM VIỆC CHÍNH (WORKSPACE) */}
      <div className={embedded ? '' : `admin-workspace ${sidebarCollapsed ? 'is-sidebar-collapsed' : ''}`}>
        {/* TOPBAR */}
        {!embedded && <header className="admin-topbar">
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
        </header>}

        {/* NỘI DUNG CHÍNH (MAIN) */}
        <main id={embedded ? undefined : "citizen-main"} className={embedded ? "space-y-5" : "admin-main"} tabIndex={-1}>
          {/* Header Trang */}
          <div className="admin-page-heading mb-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">{meta.title}</h1>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {activeSection === 'dashboard' && (
                <button
                  className="admin-primary-action"
                  type="button"
                  onClick={() => setIsCreateModalOpen(true)}
                >
                  <Plus size={18} weight="bold" /> Chuẩn bị hồ sơ mới
                </button>
              )}
              {isDossierSection && (
                <button
                  className="admin-primary-action"
                  type="button"
                  onClick={() => setIsCreateModalOpen(true)}
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
              onOpenDossierDetail={handleOpenDossierDetail}
            />
          )}

          {activeSection === 'dossier_detail' && selectedDossierDetail && (
            <CitizenDossierDetailView
              dossier={selectedDossierDetail}
              onBack={() => selectSection(selectedDossierDetail.status === 'Bản nháp' ? 'dossiers_draft' : 'dossiers_all')}
              onSubmitPrecheck={handleSubmitPrecheck}
              onResubmitPrecheck={handleResubmitPrecheck}
              onUpdateChecklistItem={handleUpdateChecklistItem}
              submitting={submittingAction}
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

      {/* Modal Khởi tạo hồ sơ tiền kiểm mới */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Chuẩn bị hồ sơ tiền kiểm mới</h3>
                <p className="text-xs text-slate-500 mt-0.5">Khởi tạo bản nháp để chuẩn bị giấy tờ và kiểm tra trước khi đến quầy</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                aria-label="Đóng"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Chọn thủ tục hành chính <span className="text-red-500">*</span>
                </label>
                {proceduresQuery.isLoading ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-500">
                    Đang tải danh sách thủ tục...
                  </div>
                ) : availableProcedures.length === 0 ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-800">
                    Chưa có thủ tục nào được xuất bản trong hệ thống.
                  </div>
                ) : (
                  <select
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 font-medium text-slate-800 outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100"
                    value={selectedProcedureId || availableProcedures[0]?.id || ''}
                    onChange={(e) => setSelectedProcedureId(e.target.value)}
                  >
                    {availableProcedures.map((proc) => (
                      <option key={proc.id} value={proc.id}>
                        {proc.title} (Mã: {proc.procedureCode || proc.id.slice(0, 8)})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Đơn vị hành chính tiếp nhận (Xã / Phường) <span className="text-red-500">*</span>
                </label>
                {wardsQuery.isLoading ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-500">
                    Đang tải danh sách UBND Xã/Phường...
                  </div>
                ) : (
                  <select
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 font-medium text-slate-800 outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100"
                    value={newWardCode}
                    onChange={(e) => setNewWardCode(e.target.value)}
                  >
                    {(availableWards.length > 0 ? availableWards : [
                      { id: '1', code: 'PHUONG_BEN_NGHE', name: 'UBND Phường Bến Nghé' },
                      { id: '2', code: 'PHUONG_BINH_HOA', name: 'UBND Phường Bình Hòa' },
                      { id: '3', code: 'PHUONG_PHUOC_HAU', name: 'UBND Phường Phước Hậu' },
                    ]).map((ward) => (
                      <option key={ward.code} value={ward.code}>
                        {ward.name} (Mã: {ward.code})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-[11px] leading-relaxed text-amber-900">
                <strong>Lưu ý:</strong> Bản nháp sẽ được khởi tạo trong tài khoản của bạn. Sau khi điền tờ khai và đính kèm đủ các giấy tờ bắt buộc, bạn có thể nộp tiền kiểm để Cán bộ một cửa xem xét trực tuyến.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleCreateDraft}
                disabled={submittingAction}
                className="rounded-xl bg-red-800 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-red-900 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {submittingAction ? 'Đang khởi tạo...' : 'Tạo hồ sơ nháp'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
