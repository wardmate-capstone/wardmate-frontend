import { StaffingView } from '@/components/staffing/StaffingView';
import { formatDateTime } from '@/lib/dateFormat';
import { CalendarClosuresView } from '@/components/staffing/CalendarClosuresView';
import { ConsultationsView } from '@/components/staffing/ConsultationsView';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { toast } from '@/components/ui/Toast';
// INITIAL_OFFICER_APPLICATIONS, INITIAL_OFFICER_AUDIT_LOGS, INITIAL_OFFICER_NOTIFICATIONS đã được xóa — dữ liệu hồ sơ, audit, thông báo sẽ lấy từ API sau.
import type {
  OfficerApplication,
  OfficerSection,
  OfficerNotification,
  OfficerReviewComment,
} from '@/types/officer';

import { UnifiedOfficerSidebar as OfficerSidebar } from '@/components/layout/RoleWorkspaceSidebars';
import { OfficerHeader, SECTION_TITLES } from './OfficerHeader';
import { getGreeting } from '@/lib/utils';
import '@/styles/workspace-ui.css';
import { useAutoStackTables } from '@/hooks/useAutoStackTables';
import { OfficerDashboardView } from './OfficerDashboardView';
import { OfficerApplicationListView } from './OfficerApplicationListView';
import { OfficerReviewWorkspaceView } from './OfficerReviewWorkspaceView';
import { OfficerAuditLogView } from './OfficerAuditLogView';
import { OfficerNotificationView } from './OfficerNotificationView';
import { UnifiedSelfProfileView } from '@/components/profile/UnifiedSelfProfileView';
import { OfficerQuickPreview } from './OfficerQuickPreview';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAuthStore } from '@/stores/authStore';
import {
  useOfficerApplications,
  useAssignOfficerMutation,
  useRequestRevisionMutation,
  useConfirmReadinessMutation,
} from '@/hooks/useWorkflow';
import {
  mapSummaryDtoToOfficerApplication,
  mapApplicationDtoToOfficerApplication,
  type OfficerLookup,
} from '@/lib/api/workflowAdapters';
import { getManagerOfficers, refreshAssignedCategories } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { useNotificationHub } from '@/hooks/useNotificationHub';
import { workflowError, workflowApi } from '@/lib/api/workflow';
import { useProcedureCategories } from '@/hooks/useProcedureCategories';
import { Button, Modal, ErrorAlert } from '@/components/ui';
import type { QueueTab } from './OfficerApplicationListView';

// Trạng thái Workflow gửi lên server theo mục sidebar; "Đã gửi lại" là SUBMITTED có resubmitCount > 0.
const SECTION_STATUS: Partial<Record<OfficerSection, string>> = {
  'apps-pending': 'SUBMITTED',
  'apps-reviewing': 'UNDER_REVIEW',
  'apps-need-revision': 'NEED_REVISION',
  'apps-resubmitted': 'SUBMITTED',
  'apps-approved': 'DOCUMENTS_READY',
};

// Ngày chọn là ngày Việt Nam; gửi mốc đầu/cuối ngày theo giờ trình duyệt dạng ISO.
function dayBoundary(date: string, end: boolean): string | undefined {
  if (!date) return undefined;
  const value = new Date(`${date}T${end ? '23:59:59.999' : '00:00:00'}`);
  return Number.isNaN(value.getTime()) ? undefined : value.toISOString();
}

export const OfficerPage: React.FC = () => {
  const { profile } = useUserProfile();
  const user = useAuthStore((state) => state.user);
  const officerName = profile?.fullName?.trim() || user?.username || 'Cán bộ Một cửa';

  // Navigation States
  const [activeSection, setActiveSection] = useState<OfficerSection>('dashboard');
  const [reviewingApp, setReviewingApp] = useState<OfficerApplication | null>(null);
  const [quickPreviewApp, setQuickPreviewApp] = useState<OfficerApplication | null>(null);
  // Bảng danh sách thành thẻ có nhãn trên điện thoại (L22), giống Admin/Công dân.
  const mainRef = useRef<HTMLElement>(null);
  useAutoStackTables(mainRef);
  const [searchParams] = useSearchParams();
  const location = useLocation();
  useEffect(() => {
    const section = searchParams.get('section');
    if (section && ['shifts', 'closures', 'leaves', 'consultations'].includes(section)) {
      setActiveSection(section as OfficerSection); setReviewingApp(null);
    }
  }, [location.key, searchParams]);
  const urlApplicationId = searchParams.get('applicationId');
  const openedUrlAppRef = useRef<string | null>(null);

  // TanStack Query & Mutations từ Workflow API
  const [queuePage, setQueuePage] = useState(1);
  const [submittedRange, setSubmittedRange] = useState({ from: '', to: '' });
  // Tab mặc định ưu tiên lĩnh vực của cán bộ (ưu tiên mềm: vẫn xem/nhận được lĩnh vực khác ở tab Toàn phường).
  const [queueTab, setQueueTab] = useState<QueueTab>('my-categories');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [overdueOnly, setOverdueOnly] = useState(false);
  const myCategoryIds = useMemo(() => user?.assignedCategories ?? [], [user?.assignedCategories]);
  // Manager đổi lĩnh vực thì cập nhật nhãn "Ngoài lĩnh vực" mà không cần đăng nhập lại:
  // tải lại khi quay lại tab trình duyệt và định kỳ 60 giây.
  useQuery({
    queryKey: ['iam', 'me', 'assigned-categories', user?.id],
    queryFn: refreshAssignedCategories,
    enabled: Boolean(user?.id),
    refetchOnWindowFocus: true,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
  const categoriesQuery = useProcedureCategories();
  const inListSection = activeSection.startsWith('apps-');
  // Khoảng ngày ngược thì không gửi (BE trả 400); danh sách tự hiển thị lỗi tại bộ lọc.
  const rangeValid = !submittedRange.from || !submittedRange.to || submittedRange.from <= submittedRange.to;
  const officerApplicationsQuery = useOfficerApplications({
    page: queuePage,
    pageSize: 50,
    // Không chọn trạng thái: BE tự loại bản nháp và hồ sơ chưa từng nộp.
    status: SECTION_STATUS[activeSection],
    submittedFrom: rangeValid ? dayBoundary(submittedRange.from, false) : undefined,
    submittedTo: rangeValid ? dayBoundary(submittedRange.to, true) : undefined,
    // Tổng quan giữ toàn phường (BE đã xếp lĩnh vực của cán bộ lên trước); bộ lọc chỉ áp cho danh sách.
    scope: inListSection && queueTab === 'my-categories' ? 'my-categories' : undefined,
    assignee: inListSection && queueTab === 'mine' ? 'me' : undefined,
    categoryIds: inListSection && categoryId ? [categoryId] : undefined,
    overdue: inListSection && overdueOnly ? true : undefined,
  });

  // Đổi mục hoặc bộ lọc server thì quay về trang đầu để không rơi vào trang rỗng.
  useEffect(() => {
    setQueuePage(1);
  }, [activeSection, submittedRange.from, submittedRange.to, queueTab, categoryId, overdueOnly]);

  const activeQuery = officerApplicationsQuery;
  const activeData = activeQuery.data;
  const assignMutation = useAssignOfficerMutation();
  const assignLock = useRef(false);
  const requestRevisionMutation = useRequestRevisionMutation();
  const readinessMutation = useConfirmReadinessMutation();

  const refetchAll = async () => {
    await officerApplicationsQuery.refetch();
  };

  // Hồ sơ cán bộ — đồng bộ với dữ liệu backend
  const [applications, setApplications] = useState<OfficerApplication[]>([]);
  // Danh bạ tên cán bộ trong phường
  const [officerDirectory, setOfficerDirectory] = useState<Record<string, string>>({});
  // Thông báo
  // Thông báo thật từ NotificationHub (giao/chuyển hồ sơ, hồ sơ mới cần tiếp nhận…).
  const notificationHub = useNotificationHub(Boolean(user?.id));
  const notifications = useMemo<OfficerNotification[]>(() => notificationHub.items.map((n) => ({
    id: n.id,
    time: formatDateTime(n.createdAt),
    title: n.title,
    message: n.content,
    applicationId: n.applicationId ?? undefined,
    type: n.type === 'ASSIGNED_OFFICER' || n.title.includes('cần tiếp nhận') ? 'new_pending' : 'system',
    isRead: n.isRead,
  })), [notificationHub.items]);

  // Tải danh bạ cán bộ chỉ khi có quyền iam.accounts.read (Front Desk không có → không gọi, tránh 403).
  // Tên trong lịch sử phân công đã do backend lưu sẵn nên Front Desk không cần danh bạ.
  const canReadDirectory = Boolean(user?.permissions.includes('iam.accounts.read'));
  useEffect(() => {
    if (!canReadDirectory) return;
    let active = true;
    getManagerOfficers({ pageSize: 100 })
      .then((res) => {
        if (!active || !res?.items) return;
        const dir: Record<string, string> = {};
        res.items.forEach((o) => {
          if (o.id) {
            dir[o.id.toLowerCase()] = o.fullName?.trim() || o.username;
          }
        });
        setOfficerDirectory((prev) => ({ ...prev, ...dir }));
      })
      .catch(() => {
        // Danh bạ chỉ để hiện tên; lỗi thì vẫn dùng tên backend lưu sẵn hoặc mã rút gọn
      });
    return () => {
      active = false;
    };
  }, [canReadDirectory]);

  const officerLookup = useMemo<OfficerLookup>(() => {
    const dir: Record<string, string> = { ...officerDirectory };
    if (user?.id) {
      dir[user.id.toLowerCase()] = officerName;
    }
    return {
      currentOfficer: user?.id ? { id: user.id, name: officerName } : undefined,
      directory: dir,
    };
  }, [user?.id, officerName, officerDirectory]);

  // Tên người nộp lấy từ applicantName của danh sách (snapshot lúc nộp); hồ sơ cũ chưa có tên hiển thị "Công dân".
  // CCCD/SĐT không có trong danh sách theo thiết kế BE, chỉ xem trong chi tiết hồ sơ.
  useEffect(() => {
    if (activeData?.items) {
      setApplications(activeData.items.map((item) => mapSummaryDtoToOfficerApplication(item, officerLookup)));
    }
  }, [activeData, officerLookup]);

  // Sidebar Layout States
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCompact, setIsCompact] = useState(false);

  // Badge counts for sidebar
  const badgeCounts = useMemo(() => {
    return {
      pending: applications.filter((a) => a.status === 'SUBMITTED_FOR_REVIEW').length,
      reviewing: applications.filter((a) => a.status === 'UNDER_REVIEW').length,
      needRevision: applications.filter((a) => a.status === 'NEED_REVISION').length,
      resubmitted: applications.filter((a) => a.status === 'RESUBMITTED').length,
      approved: applications.filter((a) => a.status === 'DOCUMENTS_READY').length,
      unreadNotifs: notificationHub.unreadCount,
    };
  }, [applications, notificationHub.unreadCount]);

  const isMine = (app: OfficerApplication) =>
    Boolean(user?.id && app.assignedOfficerId?.toLowerCase() === user.id.toLowerCase());

  // Ngoài lĩnh vực chỉ khi cán bộ đã được gán lĩnh vực; chưa gán nghĩa là phụ trách mọi lĩnh vực.
  const isOutsideMyCategories = (app?: OfficerApplication) =>
    Boolean(app && myCategoryIds.length > 0 && !(app.categoryId && myCategoryIds.includes(app.categoryId)));
  const [outsideConfirm, setOutsideConfirm] = useState<OfficerApplication | null>(null);

  // ACTION: Nhận xử lý hồ sơ (Tiếp nhận hồ sơ tiền kiểm)
  const handleTakeApplication = async (appId: string) => {
    if (assignLock.current) return;
    assignLock.current = true;
    const targetApp = applications.find((a) => a.id === appId);
    const appNumber = targetApp?.applicationNumber || appId;
    try {
      // Kết quả nhận hồ sơ đã chứa chi tiết đầy đủ; workspace tự tải nhận xét nên không gọi thêm 2 request.
      const result = await assignMutation.mutateAsync(appId);
      toast.success(`Đã nhận xử lý hồ sơ ${appNumber}. Đang mở hồ sơ để kiểm tra.`);
      const mappedApp = mapApplicationDtoToOfficerApplication(result.application, [], officerLookup);
      setReviewingApp(mappedApp);
    } catch (err) {
      toast.error(workflowError(err));
      await refetchAll();
    } finally { assignLock.current = false; }
  };

  // Nhận hồ sơ ngoài lĩnh vực vẫn được (ưu tiên mềm) nhưng hỏi xác nhận trước.
  const requestTakeApplication = (appId: string) => {
    const target = applications.find((a) => a.id === appId) ?? (quickPreviewApp?.id === appId ? quickPreviewApp : undefined);
    if (target && !isMine(target) && isOutsideMyCategories(target)) {
      setOutsideConfirm(target);
      return;
    }
    void handleTakeApplication(appId);
  };

  // ACTION: Yêu cầu bổ sung
  const handleRequestRevision = async (appId: string, notes: string, _issues: string[], submissionId?: string) => {
    const targetApp = applications.find((a) => a.id === appId);
    const appNumber = targetApp?.applicationNumber || appId;
      await requestRevisionMutation.mutateAsync({ id: appId, input: { reason: notes }, submissionId });
      toast.warning(`Đã gửi yêu cầu bổ sung hồ sơ ${appNumber} đến công dân.`);
      setReviewingApp(null);
      setActiveSection('apps-need-revision');

  };

  // ACTION: Duyệt tiền kiểm
  const handleConfirmReadiness = async (appId: string, submissionId?: string) => {
    const targetApp = applications.find((a) => a.id === appId);
    const appNumber = targetApp?.applicationNumber || appId;
      await readinessMutation.mutateAsync({ id: appId, submissionId });
      toast.success(`Hồ sơ ${appNumber} đã được xác nhận giấy tờ sẵn sàng.`);
      // Ở lại workspace (đã khóa sửa) để cán bộ tạo PDF; mục bên trái chuyển sang Giấy tờ sẵn sàng.
      setActiveSection('apps-approved');

  };

  // ACTION: Cập nhật comments
  const handleUpdateComments = (appId: string, updatedComments: OfficerReviewComment[]) => {
    setApplications((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, comments: updatedComments } : a))
    );
    if (reviewingApp && reviewingApp.id === appId) {
      setReviewingApp({ ...reviewingApp, comments: updatedComments });
    }
  };

  // ACTION: Mở chi tiết hồ sơ thẩm định (tải chi tiết từ backend)
  const handleOpenReview = async (app: OfficerApplication) => {
    // Hồ sơ công dân gửi lại vẫn giữ cán bộ cũ: chỉ người đó nhận lại được để chuyển sang UNDER_REVIEW.
    if (app.status === 'RESUBMITTED') {
      if (isMine(app)) await handleTakeApplication(app.id);
      else toast.info(`Hồ sơ đang do ${app.assignedOfficer} phụ trách.`);
      return;
    }
    // Hồ sơ chưa có người nhận: mở ở chế độ chỉ xem (workspace chỉ cho sửa khi cán bộ đang thụ lý), không còn là ngõ cụt (L13).

    try {
      const fullDto = await workflowApi.getOfficerApplication(app.id);
      const comments = await workflowApi.getComments(app.id).catch(() => []);
      const mappedApp = mapApplicationDtoToOfficerApplication(fullDto, comments, officerLookup);
      setReviewingApp(mappedApp);
    } catch (err) {
      toast.error(workflowError(err));
    }
  };

  // ACTION: Mark all notifications read
  const handleMarkAllNotificationsRead = async () => {
    try {
      await notificationHub.markAllRead();
      toast.success('Đã đánh dấu đã đọc tất cả thông báo.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Chưa đánh dấu được thông báo. Vui lòng thử lại.');
    }
  };

  // Mở hồ sơ theo id (thông báo, lịch sử xử lý): hồ sơ có thể không nằm trong trang danh sách đang tải.
  const handleOpenFromNotification = async (notificationId: string, applicationId: string) => {
    void notificationHub.markRead(notificationId).catch(() => undefined);
    await handleOpenById(applicationId);
  };

  const handleOpenById = async (applicationId: string) => {
    const inList = applications.find((a) => a.id.toLowerCase() === applicationId.toLowerCase());
    if (inList) return handleOpenReview(inList);
    try {
      const dto = await workflowApi.getOfficerApplication(applicationId);
      await handleOpenReview(mapApplicationDtoToOfficerApplication(dto, [], officerLookup));
    } catch (err) {
      toast.error(workflowError(err));
    }
  };

  useEffect(() => {
    if (urlApplicationId && openedUrlAppRef.current !== urlApplicationId) {
      openedUrlAppRef.current = urlApplicationId;
      void handleOpenById(urlApplicationId);
    }
  }, [urlApplicationId]);

  // Breadcrumbs builder
  const breadcrumbs = useMemo(() => {
    if (reviewingApp) {
      return [
        {
          label: 'Quản lý hồ sơ',
          onClick: () => {
            setReviewingApp(null);
            setActiveSection('apps-all');
          },
        },
        {
          label: reviewingApp.applicationNumber,
        },
      ];
    }
    return undefined;
  }, [reviewingApp]);

  return (
    <div className="officer-workspace officer-layout min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Semantic Sidebar */}
      <OfficerSidebar
        activeSection={activeSection}
        onSelectSection={(sec) => {
          setReviewingApp(null);
          setActiveSection(sec);
        }}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        isCompact={isCompact}
        badgeCounts={badgeCounts}
      />

      {/* Main Content Workspace */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
          isCompact ? 'lg:pl-20' : 'lg:pl-72'
        }`}
      >
        {/* Semantic Header */}
        <OfficerHeader
          activeSection={activeSection}
          onOpenMobileMenu={() => setIsSidebarOpen(true)}
          isCompact={isCompact}
          onToggleCompact={() => setIsCompact(!isCompact)}
          unreadNotifsCount={badgeCounts.unreadNotifs}
          onOpenNotifications={() => {
            setReviewingApp(null);
            setActiveSection('notifications');
          }}
          breadcrumbs={breadcrumbs}
        />

        {/* Semantic Main Content */}
        <main ref={mainRef} id="officer-main" className="admin-main flex-1" tabIndex={-1}>
          {activeQuery.isError && !inListSection && <ErrorAlert className="mb-4" retryLabel="Thử tải lại hàng đợi" onRetry={() => void refetchAll()}>{workflowError(activeQuery.error)}</ErrorAlert>}
          {/* Tiêu đề trang chung (như Admin/Manager/Công dân); màn kiểm tra hồ sơ và Hồ sơ cá nhân tự có tiêu đề */}
          {!reviewingApp && activeSection !== 'profile' && (
            <div className="admin-page-heading mb-6">
              <div>
                <h1>{(SECTION_TITLES[activeSection] ?? SECTION_TITLES.dashboard).title}</h1>
                {activeSection === 'dashboard'
                  ? <p>{getGreeting()}, {officerName}</p>
                  : SECTION_TITLES[activeSection]?.subtitle && <p>{SECTION_TITLES[activeSection].subtitle}</p>}
              </div>
            </div>
          )}
          {/* Priority: If currently in Review Workspace */}
          {reviewingApp ? (
            <OfficerReviewWorkspaceView
              key={reviewingApp.id}
              application={reviewingApp}
              onBack={() => setReviewingApp(null)}
              onRequestRevision={handleRequestRevision}
              onConfirmReadiness={handleConfirmReadiness}
              onUpdateComments={handleUpdateComments}
            />
          ) : (
            <>
              {/* SECTION 1: DASHBOARD */}
              {activeSection === 'dashboard' && (
                <OfficerDashboardView
                  applications={applications}
                  isLoading={activeQuery.isPending}
                  onSelectSection={(sec) => setActiveSection(sec)}
                  onOpenApplicationReview={handleOpenReview}
                  onQuickPreview={(app) => setQuickPreviewApp(app)}
                />
              )}

              {/* SECTION 2: QUẢN LÝ HỒ SƠ TIỀN KIỂM */}
              {(activeSection === 'apps-all' ||
                activeSection === 'apps-pending' ||
                activeSection === 'apps-reviewing' ||
                activeSection === 'apps-need-revision' ||
                activeSection === 'apps-resubmitted' ||
                activeSection === 'apps-approved') && (
                <OfficerApplicationListView
                  applications={applications}
                  activeSection={activeSection}
                  onSelectSection={(sec) => setActiveSection(sec)}
                  onOpenReviewWorkspace={handleOpenReview}
                  onTakeApplication={requestTakeApplication}
                  currentUserId={user?.id}
                  queueTab={queueTab}
                  onQueueTabChange={setQueueTab}
                  myCategoryIds={myCategoryIds}
                  categories={categoriesQuery.data ?? []}
                  categoryId={categoryId}
                  onCategoryChange={setCategoryId}
                  overdueOnly={overdueOnly}
                  onOverdueChange={setOverdueOnly}
                  onQuickPreview={(app) => setQuickPreviewApp(app)}
                  onRefresh={() => void refetchAll()}
                  isRefreshing={activeQuery.isFetching}
                  isLoading={activeQuery.isPending}
                  errorMessage={activeQuery.isError ? workflowError(activeQuery.error) : undefined}
                  submittedRange={submittedRange}
                  onSubmittedRangeChange={setSubmittedRange}
                  pagination={{
                    currentPage: queuePage,
                    totalItems: activeData?.total ?? applications.length,
                    pageSize: 50,
                    onPrevPage: () => setQueuePage((p) => Math.max(1, p - 1)),
                    onNextPage: () => setQueuePage((p) => p + 1),
                    isFetching: activeQuery.isFetching,
                  }}
                />
              )}

              {/* SECTION 4: LỊCH SỬ XỬ LÝ (AUDIT LOG) */}
              {activeSection === 'audit-log' && (
                <OfficerAuditLogView
                  officerName={officerName}
                  onOpenApplication={(applicationId) => void handleOpenById(applicationId)}
                />
              )}

              {/* SECTION 5: THÔNG BÁO CA TRỰC */}
              {activeSection === 'notifications' && (
                <OfficerNotificationView
                  notifications={notifications}
                  connectionStatus={notificationHub.status}
                  onMarkAllAsRead={() => void handleMarkAllNotificationsRead()}
                  onOpenApplication={(notificationId, applicationId) => void handleOpenFromNotification(notificationId, applicationId)}
                />
              )}

              {/* SECTION 6: HỒ SƠ CÁ NHÂN & QUẦY TRỰC */}
              {activeSection === 'shifts' && <StaffingView mode="shifts" />}
              {activeSection === 'closures' && <CalendarClosuresView />}
              {activeSection === 'leaves' && <StaffingView mode="leaves" />}
              {activeSection === 'consultations' && <ConsultationsView />}
              {activeSection === 'profile' && <UnifiedSelfProfileView />}
            </>
          )}
        </main>
      </div>

      {/* Xem nhanh: tự tải chi tiết hồ sơ để có giấy tờ, CCCD, SĐT và tên phường (L12). */}
      {quickPreviewApp && (
        <OfficerQuickPreview
          app={quickPreviewApp}
          canTake={quickPreviewApp.status === 'SUBMITTED_FOR_REVIEW' || (quickPreviewApp.status === 'RESUBMITTED' && isMine(quickPreviewApp))}
          onClose={() => setQuickPreviewApp(null)}
          onTake={() => { const id = quickPreviewApp.id; setQuickPreviewApp(null); requestTakeApplication(id); }}
          onOpen={() => { const app = quickPreviewApp; setQuickPreviewApp(null); void handleOpenReview(app); }}
        />
      )}

      <Modal
        open={Boolean(outsideConfirm)}
        onOpenChange={(open) => !open && setOutsideConfirm(null)}
        title="Nhận hồ sơ ngoài lĩnh vực?"
        description={`Hồ sơ ${outsideConfirm?.applicationNumber ?? ''} thuộc lĩnh vực "${outsideConfirm?.procedureCategory ?? ''}", không nằm trong lĩnh vực bạn được phân công. Bạn vẫn có thể nhận để hỗ trợ xử lý.`}
        footer={
          <>
            <Button variant="outline" onClick={() => setOutsideConfirm(null)}>Để cán bộ khác nhận</Button>
            <Button
              onClick={() => {
                const id = outsideConfirm?.id;
                setOutsideConfirm(null);
                if (id) void handleTakeApplication(id);
              }}
            >
              Vẫn nhận xử lý
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">Sau khi nhận, hồ sơ chuyển sang Đang kiểm tra và bạn là cán bộ phụ trách.</p>
      </Modal>
    </div>
  );
};
