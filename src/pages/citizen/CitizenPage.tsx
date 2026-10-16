import { useEffect, useState, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useUserProfile } from '@/hooks/useUserProfile';
import { UserDropdown } from '@/components/layout/UserDropdown';
import { WorkspaceSidebar, type WorkspaceNavGroup } from '@/components/layout/WorkspaceSidebar';
import { toast } from '@/components/ui/Toast';
import { Button } from '@/components/ui';
import { CitizenFeedbackModal } from '@/components/feedback/CitizenFeedbackModal';
import { ProceduresPage } from '@/pages/public/ProceduresPage';
import { usePublicProcedureDetail, usePublicProcedureList } from '@/hooks/useProcedureCategories';
import { getPublicWards } from '@/lib/api';
import {
  useCitizenApplications,
  useSubmitApplicationMutation,
  useResubmitApplicationMutation,
  useCreateApplicationMutation,
  workflowQueryKeys,
} from '@/hooks/useWorkflow';
import { workflowApi, workflowError } from '@/lib/api/workflow';
import { documentFormApi } from '@/lib/api/documentForms';
import { hasChecklistEvidence } from '@/lib/documentEvidence';
import { CreateDossierModal, type CreateDossierValues } from './components/CreateDossierModal';
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
  const requestedProcedureId = searchParams.get('procedureId');
  const requestedCaseCode = searchParams.get('caseCode');
  const queryClient = useQueryClient();

  const { profile: userProfile, loading: profileLoading, refetch: refetchProfile } = useUserProfile();
  const [activeSection, setActiveSection] = useState<CitizenSectionId>(() => embedded ? initialSection : urlSection || initialSection);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // TanStack Query: Lấy danh sách hồ sơ công dân từ backend
  const [dossierPage, setDossierPage] = useState(1);
  const citizenAppsQuery = useCitizenApplications(dossierPage, 50);
  const submitMutation = useSubmitApplicationMutation();
  const resubmitMutation = useResubmitApplicationMutation();
  const createMutation = useCreateApplicationMutation();

  // Lấy danh sách thủ tục công khai từ Catalog để chọn khi tạo hồ sơ
  const proceduresQuery = usePublicProcedureList({ pageNumber: 1, pageSize: 50 });

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
  const [selectedCaseCode, setSelectedCaseCode] = useState('');
  const [newWardCode, setNewWardCode] = useState('');
  const selectedProcedureQuery = usePublicProcedureDetail(selectedProcedureId);
  const availableProcedures = useMemo(() => {
    const listed = proceduresQuery.data?.items ?? [];
    const detail = selectedProcedureQuery.data;
    return detail && !listed.some(item => item.id === detail.id) ? [...listed, detail] : listed;
  }, [proceduresQuery.data, selectedProcedureQuery.data]);
  const consumedProcedure = useRef<string | null>(null);
  const availableCases = useMemo(
    () => selectedProcedureQuery.data?.contentPayload.cases || [],
    [selectedProcedureQuery.data],
  );

  // Khởi tạo thủ tục mặc định khi danh sách thủ tục tải xong
  useEffect(() => {
    if (requestedProcedureId && consumedProcedure.current !== requestedProcedureId) {
      consumedProcedure.current = requestedProcedureId;
      setSelectedProcedureId(requestedProcedureId);
      setIsCreateModalOpen(true);
    } else if (availableProcedures.length > 0 && !selectedProcedureId) {
      setSelectedProcedureId(availableProcedures[0].id);
    }
  }, [availableProcedures, requestedProcedureId, selectedProcedureId]);

  useEffect(() => {
    const nextCase = selectedProcedureId === requestedProcedureId && requestedCaseCode && availableCases.some((item) => item.caseCode === requestedCaseCode)
      ? requestedCaseCode
      : availableCases.length === 1 ? availableCases[0].caseCode : '';
    setSelectedCaseCode(nextCase);
  }, [availableCases, requestedCaseCode, requestedProcedureId, selectedProcedureId]);

  // Khởi tạo phường mặc định khi danh sách phường tải xong
  useEffect(() => {
    if (availableWards.length > 0 && !newWardCode) {
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

  // Thông báo
  const [notifications, setNotifications] = useState<CitizenNotification[]>([]);
  // Feedback modal state
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [selectedFeedbackDossier, setSelectedFeedbackDossier] = useState<{ procedure: string; code?: string }>({
    procedure: 'Dịch vụ hỗ trợ thủ tục',
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
        toast.error(`Chưa tải được chi tiết hồ sơ: ${workflowError(err)}`);
      }
    }
  }

  // Xử lý nộp tiền kiểm lần đầu
  async function validateEvidence() {
    if (!selectedDossierDetail?.id) throw new Error('Không tìm thấy hồ sơ.');
    const fresh = await workflowApi.getApplication(selectedDossierDetail.id);
    const mapped = mapApplicationDtoToCitizenDossier(fresh);
    setSelectedDossierDetail(mapped);
    const contents = await documentFormApi.getContents(fresh.id);
    const missing = (mapped.checklist || []).filter(x => x.isMandatory && !hasChecklistEvidence(x, contents));
    if (missing.length) throw new Error('Chưa đủ tài liệu: ' + missing.map(x => x.itemName).join(', '));
    return { fresh, mapped, contents };
  }

  async function handleSubmitPrecheck() {
    if (!selectedDossierDetail?.id) {
      toast.error('Không tìm thấy thông tin hồ sơ.');
      return;
    }
    try {
      setSubmittingAction(true);
      const { fresh, mapped, contents } = await validateEvidence();
      if (fresh.status !== 'DRAFT') throw new Error('Hồ sơ không còn ở trạng thái bản nháp.');
      for (const item of mapped.checklist || []) {
        const status = hasChecklistEvidence(item, contents) ? 'COMPLETED' : 'PENDING';
        if (status !== item.status) await workflowApi.updateChecklist(fresh.id, item.checklistId, { status });
      }
      const updated = await submitMutation.mutateAsync(fresh.id);
      toast.success(`Hồ sơ ${updated.applicationCode} đã được nộp tiền kiểm trực tuyến thành công! Cán bộ sẽ sớm phản hồi.`);
      setSelectedDossierDetail(mapApplicationDtoToCitizenDossier(updated));
      queryClient.invalidateQueries({ queryKey: workflowQueryKeys.citizenApplications() });
    } catch (err) {
      const msg = workflowError(err);
      toast.error(`Không thể nộp tiền kiểm: ${msg}`);
      throw err;
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
      const { fresh, mapped, contents } = await validateEvidence();
      if (fresh.status !== 'NEED_REVISION') throw new Error('Hồ sơ không còn ở trạng thái cần chỉnh sửa.');
      const resubmitChecklists = (mapped.checklist || []).map(item => ({ id: item.checklistId, status: hasChecklistEvidence(item, contents) ? 'COMPLETED' : 'PENDING', fileUrl: null }));

      const updated = await resubmitMutation.mutateAsync({
        id: selectedDossierDetail.id,
        input: {
          expectedVersionNumber: fresh.currentVersionNumber,
          formData: mapped.formData || {},
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
      throw err;
    } finally {
      setSubmittingAction(false);
    }
  }

  // Cập nhật trạng thái mục checklist lên API
  async function handleUpdateChecklistItem(checklistId: string, status: 'PENDING' | 'COMPLETED') {
    if (!selectedDossierDetail?.id) return;
    try {
      await workflowApi.updateChecklist(selectedDossierDetail.id, checklistId, {
        status,
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
      toast.error(workflowError(err));
      throw err;
    }
  }

  // Tạo mới hồ sơ nháp
  async function handleCreateDraft(values: CreateDossierValues) {
    try {
      const targetProc = availableProcedures.find((p) => p.id === values.procedureId);
      if (!targetProc) {
        toast.error('Chưa có thủ tục hành chính nào được chọn.');
        return;
      }
      if (!values.wardCode) {
        toast.error('Vui lòng chọn đơn vị hành chính tiếp nhận.');
        return;
      }
      if (availableCases.length > 0 && !values.caseCode) {
        toast.error('Vui lòng chọn trường hợp thực hiện thủ tục.');
        return;
      }

      setSubmittingAction(true);
      const created = await createMutation.mutateAsync({
        procedureId: targetProc.id,
        caseCode: values.caseCode || null,
        wardCode: values.wardCode,
        formData: {
          procedureTitle: targetProc.title,
          procedureCode: targetProc.procedureCode,
          applicantName: userProfile?.fullName || '',
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
      throw err;
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
    setDossierPage(1);
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
          {citizenAppsQuery.isError && <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4"><p>{workflowError(citizenAppsQuery.error)}</p><Button variant="outline" onClick={() => void citizenAppsQuery.refetch()}>Thử tải lại hồ sơ</Button></div>}
          {isDossierSection && citizenAppsQuery.isPending && <p role="status">Đang tải hồ sơ của bạn…</p>}
          {isDossierSection && citizenAppsQuery.isSuccess && <div className="mb-4 flex flex-wrap items-center gap-3"><Button variant="outline" disabled={dossierPage === 1 || citizenAppsQuery.isFetching} onClick={() => setDossierPage(p => p - 1)}>Trang trước</Button><span className="text-sm">Trang {dossierPage} · {citizenAppsQuery.data.total} hồ sơ. Bộ lọc áp dụng trên trang hiện tại.</span><Button variant="outline" disabled={citizenAppsQuery.isFetching || dossierPage * 50 >= citizenAppsQuery.data.total} onClick={() => setDossierPage(p => p + 1)}>Trang sau</Button></div>}
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
              {isDossierSection && citizenAppsQuery.isSuccess && (
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

          {isDossierSection && citizenAppsQuery.isSuccess && (
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

      {/* Modal Đánh giá dịch vụ */}
      <CitizenFeedbackModal
        open={isFeedbackModalOpen}
        onOpenChange={setIsFeedbackModalOpen}
        procedureName={selectedFeedbackDossier.procedure}
        applicationCode={selectedFeedbackDossier.code}
      />

      <CreateDossierModal open={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} initial={{ procedureId: selectedProcedureId, caseCode: selectedCaseCode, wardCode: newWardCode }} procedures={availableProcedures} wards={availableWards} cases={availableCases} loading={proceduresQuery.isPending || wardsQuery.isPending || selectedProcedureQuery.isFetching} unavailable={proceduresQuery.isError || wardsQuery.isError || selectedProcedureQuery.isError} onRetry={() => { void proceduresQuery.refetch(); void wardsQuery.refetch(); if (selectedProcedureId) void selectedProcedureQuery.refetch(); }} busy={submittingAction} onProcedureChange={setSelectedProcedureId} onSubmit={handleCreateDraft} />
    </div>
  );
}
