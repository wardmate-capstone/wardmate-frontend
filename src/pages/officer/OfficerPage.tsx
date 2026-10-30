import { StaffingView } from '@/components/staffing/StaffingView';
import { ConsultationsView } from '@/components/staffing/ConsultationsView';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { toast } from '@/components/ui/Toast';
// INITIAL_OFFICER_APPLICATIONS, INITIAL_OFFICER_AUDIT_LOGS, INITIAL_OFFICER_NOTIFICATIONS đã được xóa — dữ liệu hồ sơ, audit, thông báo sẽ lấy từ API sau.
import type {
  OfficerApplication,
  OfficerSection,
  OfficerAuditLog,
  OfficerNotification,
  OfficerReviewComment,
} from '@/types/officer';

import { UnifiedOfficerSidebar as OfficerSidebar } from '@/components/layout/RoleWorkspaceSidebars';
import { OfficerHeader } from './OfficerHeader';
import { OfficerDashboardView } from './OfficerDashboardView';
import { OfficerApplicationListView } from './OfficerApplicationListView';
import { OfficerReviewWorkspaceView } from './OfficerReviewWorkspaceView';
import { OfficerAuditLogView } from './OfficerAuditLogView';
import { OfficerNotificationView } from './OfficerNotificationView';
import { UnifiedSelfProfileView } from '@/components/profile/UnifiedSelfProfileView';
import { X, Eye, ArrowRight } from '@phosphor-icons/react';
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
  parseFormData,
  extractCitizenInfoFromFormData,
  type OfficerLookup,
} from '@/lib/api/workflowAdapters';
import { getManagerOfficers, refreshAssignedCategories } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { useNotificationHub } from '@/hooks/useNotificationHub';
import { workflowError, workflowApi, OFFICER_VISIBLE_STATUSES } from '@/lib/api/workflow';
import { useProcedureCategories } from '@/hooks/useProcedureCategories';
import { Button, Modal } from '@/components/ui';
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
    status: SECTION_STATUS[activeSection] ?? OFFICER_VISIBLE_STATUSES,
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
  // Nhật ký hoạt động
  const [auditLogs, setAuditLogs] = useState<OfficerAuditLog[]>([]);
  // Thông báo
  // Thông báo thật từ NotificationHub (giao/chuyển hồ sơ, hồ sơ mới cần tiếp nhận…).
  const notificationHub = useNotificationHub(Boolean(user?.id));
  const notifications = useMemo<OfficerNotification[]>(() => notificationHub.items.map((n) => ({
    id: n.id,
    time: new Date(n.createdAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }),
    title: n.title,
    message: n.content,
    applicationId: n.applicationId ?? undefined,
    type: n.type === 'ASSIGNED_OFFICER' || n.title.includes('cần tiếp nhận') ? 'new_pending' : 'system',
    isRead: n.isRead,
  })), [notificationHub.items]);

  // Tải danh bạ cán bộ trong phường nếu có quyền (vd: Manager hoặc tài khoản có quyền)
  useEffect(() => {
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
        // Cán bộ thường không có quyền iam.accounts.read, bỏ qua lỗi 403
      });
    return () => {
      active = false;
    };
  }, []);

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

  // Cache thông tin công dân theo id hồ sơ để hiển thị ngay trên bảng
  const [citizenInfoMap, setCitizenInfoMap] = useState<Record<string, { fullName: string; citizenId: string }>>({});

  // Tự động nạp ngầm (auto-enrich) thông tin công dân cho danh sách hồ sơ khi summary chưa có applicantName
  useEffect(() => {
    if (!activeData?.items || activeData.items.length === 0) return;

    // Lọc ra các hồ sơ chưa có tên người dân và chưa được cache
    const needEnrich = activeData.items.filter(
      (item) => (!item.applicantName || item.applicantName.trim() === '') && !citizenInfoMap[item.id]
    );

    if (needEnrich.length === 0) return;

    let isMounted = true;
    Promise.allSettled(
      needEnrich.map(async (item) => {
        const detail = await workflowApi.getOfficerApplication(item.id);
        const parsed = parseFormData(detail.formData);
        const info = extractCitizenInfoFromFormData(parsed);
        return { id: item.id, fullName: info.fullName, citizenId: info.citizenId };
      })
    ).then((results) => {
      if (!isMounted) return;
      const updates: Record<string, { fullName: string; citizenId: string }> = {};
      results.forEach((res) => {
        if (res.status === 'fulfilled' && res.value.fullName && res.value.fullName !== 'Công dân') {
          updates[res.value.id] = {
            fullName: res.value.fullName,
            citizenId: res.value.citizenId,
          };
        }
      });
      if (Object.keys(updates).length > 0) {
        setCitizenInfoMap((prev) => ({ ...prev, ...updates }));
      }
    });

    return () => {
      isMounted = false;
    };
  }, [activeData?.items, citizenInfoMap]);

  // Cập nhật applications khi có dữ liệu từ backend (kết hợp với citizenInfoMap)
  useEffect(() => {
    if (activeData?.items) {
      const mapped = activeData.items.map((item) => {
        const base = mapSummaryDtoToOfficerApplication(item, officerLookup);
        const cached = citizenInfoMap[item.id];
        if (cached) {
          base.citizen.fullName = cached.fullName;
          if (cached.citizenId && cached.citizenId !== '—') {
            base.citizen.citizenId = cached.citizenId;
          }
        }
        return base;
      });
      setApplications(mapped);
    }
  }, [activeData, officerLookup, citizenInfoMap]);

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
      toast.success(`Đã nhận xử lý hồ sơ ${appNumber}. Đang mở không gian thẩm định.`);
      const mappedApp = mapApplicationDtoToOfficerApplication(result.application, [], officerLookup);

      // Thêm audit log
      const newLog: OfficerAuditLog = {
        id: `log-${Date.now()}`,
        time: new Date().toLocaleTimeString('vi-VN'),
        applicationNumber: mappedApp.applicationNumber,
        citizenName: mappedApp.citizen.fullName,
        action: 'Nhận xử lý hồ sơ',
        details: 'Chuyển trạng thái sang ĐANG KIỂM TRA và mở workspace thẩm định',
        officerName,
        badgeTone: 'info',
      };
      setAuditLogs((prev) => [newLog, ...prev]);
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
  const handleRequestRevision = async (appId: string, notes: string, issues: string[], submissionId?: string) => {
    const targetApp = applications.find((a) => a.id === appId);
    const appNumber = targetApp?.applicationNumber || appId;
      await requestRevisionMutation.mutateAsync({ id: appId, input: { reason: notes }, submissionId });

      // Audit Log
      const newLog: OfficerAuditLog = {
        id: `log-${Date.now()}`,
        time: new Date().toLocaleTimeString('vi-VN'),
        applicationNumber: appNumber,
        citizenName: targetApp?.citizen.fullName || 'Công dân',
        action: 'Yêu cầu bổ sung',
        details: notes || `Yêu cầu chỉnh sửa ${issues.length} mục`,
        officerName,
        badgeTone: 'warning',
      };
      setAuditLogs((prev) => [newLog, ...prev]);

      toast.warning(`Đã gửi yêu cầu bổ sung hồ sơ ${appNumber} đến công dân.`);
      setReviewingApp(null);
      setActiveSection('apps-need-revision');

  };

  // ACTION: Duyệt tiền kiểm
  const handleConfirmReadiness = async (appId: string, submissionId?: string) => {
    const targetApp = applications.find((a) => a.id === appId);
    const appNumber = targetApp?.applicationNumber || appId;
      await readinessMutation.mutateAsync({ id: appId, submissionId });

      // Audit Log
      const newLog: OfficerAuditLog = {
        id: `log-${Date.now()}`,
        time: new Date().toLocaleTimeString('vi-VN'),
        applicationNumber: appNumber,
        citizenName: targetApp?.citizen.fullName || 'Công dân',
        action: 'Xác nhận giấy tờ sẵn sàng',
        details: 'Giấy tờ sẵn sàng để người dân tải và mang đến phường',
        officerName,
        badgeTone: 'success',
      };
      setAuditLogs((prev) => [newLog, ...prev]);

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
    if (app.status === 'SUBMITTED_FOR_REVIEW') {
      toast.info('Bấm Nhận xử lý để nhận thụ lý trước khi mở hồ sơ.');
      return;
    }

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

  // Mở hồ sơ từ thông báo: hồ sơ có thể không nằm trong trang danh sách đang tải nên lấy chi tiết theo id.
  const handleOpenFromNotification = async (notificationId: string, applicationId: string) => {
    void notificationHub.markRead(notificationId).catch(() => undefined);
    const inList = applications.find((a) => a.id.toLowerCase() === applicationId.toLowerCase());
    if (inList) return handleOpenReview(inList);
    try {
      const dto = await workflowApi.getOfficerApplication(applicationId);
      await handleOpenReview(mapApplicationDtoToOfficerApplication(dto, [], officerLookup));
    } catch (err) {
      toast.error(workflowError(err));
    }
  };

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
    <div className="officer-workspace min-h-screen bg-slate-50 text-slate-900 flex">
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
        <main id="officer-main" className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto" tabIndex={-1}>
          {activeQuery.isError && <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4"><p>{workflowError(activeQuery.error)}</p><Button variant="outline" onClick={() => void refetchAll()}>Thử tải lại hàng đợi</Button></div>}
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
                  logs={auditLogs}
                  onSelectApplication={(appNum) => {
                    const target = applications.find((a) => a.applicationNumber === appNum);
                    if (target) handleOpenReview(target);
                  }}
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
              {activeSection === 'leaves' && <StaffingView mode="leaves" />}
              {activeSection === 'consultations' && <ConsultationsView />}
              {activeSection === 'profile' && <UnifiedSelfProfileView />}
            </>
          )}
        </main>
      </div>

      {/* QUICK PREVIEW DIALOG MODAL */}
      {quickPreviewApp && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="quick-preview-title"
        >
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Eye size={22} className="text-red-800" />
                <h4 id="quick-preview-title" className="text-base font-bold text-slate-950">
                  Xem nhanh hồ sơ: {quickPreviewApp.applicationNumber}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setQuickPreviewApp(null)}
                className="text-slate-400 hover:text-slate-700"
                aria-label="Đóng xem nhanh"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <span className="block font-bold uppercase text-[10px] text-slate-400">Thông tin người nộp</span>
                <p><strong>Họ tên:</strong> {quickPreviewApp.citizen.fullName}</p>
                <p><strong>CCCD:</strong> <span className="font-mono">{quickPreviewApp.citizen.citizenId}</span></p>
                <p><strong>SĐT:</strong> {quickPreviewApp.citizen.phoneNumber}</p>
                <p><strong>Địa chỉ:</strong> {quickPreviewApp.citizen.address}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <span className="block font-bold uppercase text-[10px] text-slate-400">Thông tin thủ tục</span>
                <p><strong>Thủ tục:</strong> {quickPreviewApp.procedureName}</p>
                <p><strong>Lĩnh vực:</strong> {quickPreviewApp.procedureCategory}</p>
                <p><strong>Thời gian nộp:</strong> {quickPreviewApp.submittedAt}</p>
                <p><strong>Phiên bản:</strong> V{quickPreviewApp.currentVersion}</p>
              </div>
            </div>

            {/* Checklist summary */}
            <div className="space-y-1.5">
              <span className="block text-xs font-bold text-slate-800">Thành phần giấy tờ đã nộp:</span>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {quickPreviewApp.documents.map((d) => (
                  <li key={d.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="truncate max-w-[200px]">{d.name}</span>
                    <span className="text-[10px] uppercase font-bold text-slate-500">{d.fileType}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setQuickPreviewApp(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Đóng
              </button>

              <div className="flex items-center gap-2">
                {(quickPreviewApp.status === 'SUBMITTED_FOR_REVIEW' || (quickPreviewApp.status === 'RESUBMITTED' && isMine(quickPreviewApp))) && (
                  <button
                    type="button"
                    onClick={() => {
                      const id = quickPreviewApp.id;
                      setQuickPreviewApp(null);
                      requestTakeApplication(id);
                    }}
                    className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-red-800 text-xs font-bold text-white hover:bg-red-900 shadow-2xs"
                  >
                    <span>Nhận xử lý ngay</span>
                    <ArrowRight size={14} />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    const app = quickPreviewApp;
                    setQuickPreviewApp(null);
                    handleOpenReview(app);
                  }}
                  className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-slate-900 text-xs font-bold text-white hover:bg-slate-800 shadow-2xs"
                >
                  <span>Mở workspace đầy đủ</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
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
