import React, { useState, useMemo } from 'react';
import { toast } from '@/components/ui/Toast';
// INITIAL_OFFICER_APPLICATIONS, INITIAL_OFFICER_AUDIT_LOGS, INITIAL_OFFICER_NOTIFICATIONS đã được xóa — dữ liệu hồ sơ, audit, thông báo sẽ lấy từ API sau.
import type {
  OfficerApplication,
  OfficerSection,
  OfficerAuditLog,
  OfficerNotification,
  OfficerReviewComment,
  OfficialReceiptData,
} from '@/types/officer';

import { UnifiedOfficerSidebar as OfficerSidebar } from '@/components/layout/RoleWorkspaceSidebars';
import { OfficerHeader } from './OfficerHeader';
import { OfficerDashboardView } from './OfficerDashboardView';
import { OfficerApplicationListView } from './OfficerApplicationListView';
import { OfficerReviewWorkspaceView } from './OfficerReviewWorkspaceView';
import { OfficerReceiptWorkspaceView } from './OfficerReceiptWorkspaceView';
import { OfficerAuditLogView } from './OfficerAuditLogView';
import { OfficerNotificationView } from './OfficerNotificationView';
import { UnifiedSelfProfileView } from '@/components/profile/UnifiedSelfProfileView';
import { X, Eye, ArrowRight } from '@phosphor-icons/react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAuthStore } from '@/stores/authStore';

export const OfficerPage: React.FC = () => {
  const { profile } = useUserProfile();
  const user = useAuthStore((state) => state.user);
  const officerName = profile?.fullName?.trim() || user?.username || 'Cán bộ Một cửa';

  // Hồ sơ cán bộ — API sẽ được tích hợp sau
  const [applications, setApplications] = useState<OfficerApplication[]>([]);
  // Nhật ký hoạt động — API sẽ được tích hợp sau
  const [auditLogs, setAuditLogs] = useState<OfficerAuditLog[]>([]);
  // Thông báo — API sẽ được tích hợp sau
  const [notifications, setNotifications] = useState<OfficerNotification[]>([]);

  // Navigation States
  const [activeSection, setActiveSection] = useState<OfficerSection>('dashboard');
  const [reviewingApp, setReviewingApp] = useState<OfficerApplication | null>(null);
  const [quickPreviewApp, setQuickPreviewApp] = useState<OfficerApplication | null>(null);
  const [receiptSubTab, setReceiptSubTab] = useState<'waiting' | 'received'>('waiting');

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
      approved: applications.filter((a) => a.status === 'APPROVED').length,
      readySubmit: applications.filter((a) => a.status === 'READY_TO_SUBMIT' || a.status === 'APPROVED').length,
      receivedToday: applications.filter((a) => a.status === 'OFFICIALLY_RECEIVED').length,
      unreadNotifs: notifications.filter((n) => !n.isRead).length,
    };
  }, [applications, notifications]);

  // ACTION: Nhận xử lý hồ sơ (Tiếp nhận hồ sơ tiền kiểm)
  const handleTakeApplication = (appId: string) => {
    const targetApp = applications.find((a) => a.id === appId);
    if (!targetApp) return;

    const now = '21/09/2026 09:35';
    const updatedApps = applications.map((app) => {
      if (app.id === appId) {
        return {
          ...app,
          status: 'UNDER_REVIEW' as const,
          reviewStartedAt: now,
          reviewedBy: officerName,
          assignedOfficer: officerName,
          timeline: [
            ...app.timeline,
            {
              id: `t-${Date.now()}`,
              time: now,
              title: `Cán bộ ${officerName} đã nhận xử lý hồ sơ`,
              actor: officerName,
              type: 'officer' as const,
              status: 'done' as const,
            },
          ],
        };
      }
      return app;
    });

    setApplications(updatedApps);

    // Add Audit Log
    const newLog: OfficerAuditLog = {
      id: `log-${Date.now()}`,
      time: now,
      applicationNumber: targetApp.applicationNumber,
      citizenName: targetApp.citizen.fullName,
      action: 'Nhận xử lý hồ sơ',
      details: 'Chuyển trạng thái sang ĐANG KIỂM TRA và mở workspace đối chiếu',
      officerName,
      badgeTone: 'info',
    };
    setAuditLogs([newLog, ...auditLogs]);

    toast.success(`Đã nhận xử lý hồ sơ ${targetApp.applicationNumber}. Đang mở workspace kiểm tra.`);
    const appToReview = updatedApps.find((a) => a.id === appId);
    if (appToReview) {
      setReviewingApp(appToReview);
    }
  };

  // ACTION: Yêu cầu bổ sung
  const handleRequestRevision = (appId: string, notes: string, issues: string[]) => {
    const targetApp = applications.find((a) => a.id === appId);
    if (!targetApp) return;

    const now = '21/09/2026 09:40';
    const updatedApps = applications.map((app) => {
      if (app.id === appId) {
        return {
          ...app,
          status: 'NEED_REVISION' as const,
          timeline: [
            ...app.timeline,
            {
              id: `t-${Date.now()}`,
              time: now,
              title: 'Cán bộ yêu cầu chỉnh sửa / bổ sung hồ sơ',
              actor: officerName,
              description: notes || 'Yêu cầu khắc phục các lỗi kê khai và bổ sung giấy tờ',
              type: 'officer' as const,
              status: 'done' as const,
            },
          ],
        };
      }
      return app;
    });

    setApplications(updatedApps);

    // Audit Log
    const newLog: OfficerAuditLog = {
      id: `log-${Date.now()}`,
      time: now,
      applicationNumber: targetApp.applicationNumber,
      citizenName: targetApp.citizen.fullName,
      action: 'Yêu cầu bổ sung',
      details: notes || `Yêu cầu chỉnh sửa ${issues.length} mục`,
      officerName,
      badgeTone: 'warning',
    };
    setAuditLogs([newLog, ...auditLogs]);

    toast.warning(`Đã gửi yêu cầu bổ sung hồ sơ ${targetApp.applicationNumber} đến công dân.`);
    setReviewingApp(null);
    setActiveSection('apps-need-revision');
  };

  // ACTION: Duyệt tiền kiểm
  const handleApproveApplication = (appId: string) => {
    const targetApp = applications.find((a) => a.id === appId);
    if (!targetApp) return;

    const now = '21/09/2026 09:45';
    const updatedApps = applications.map((app) => {
      if (app.id === appId) {
        return {
          ...app,
          status: 'READY_TO_SUBMIT' as const,
          reviewedAt: now,
          timeline: [
            ...app.timeline,
            {
              id: `t-${Date.now()}`,
              time: now,
              title: 'Đã duyệt tiền kiểm hợp lệ',
              actor: officerName,
              description: 'Hồ sơ đã sẵn sàng để công dân nộp tại UBND Phường An Khánh',
              type: 'officer' as const,
              status: 'done' as const,
            },
          ],
        };
      }
      return app;
    });

    setApplications(updatedApps);

    // Audit Log
    const newLog: OfficerAuditLog = {
      id: `log-${Date.now()}`,
      time: now,
      applicationNumber: targetApp.applicationNumber,
      citizenName: targetApp.citizen.fullName,
      action: 'Duyệt tiền kiểm',
      details: 'Hồ sơ đạt mọi tiêu chí, chuyển sang Chờ tiếp nhận chính thức',
      officerName,
      badgeTone: 'success',
    };
    setAuditLogs([newLog, ...auditLogs]);

    toast.success(`Hồ sơ ${targetApp.applicationNumber} đã được DUYỆT TIỀN KIỂM thành công!`);
    setReviewingApp(null);
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

  // ACTION: Xác nhận tiếp nhận chính thức tại quầy
  const handleConfirmReceipt = (appId: string, receiptData: OfficialReceiptData) => {
    const targetApp = applications.find((a) => a.id === appId);
    if (!targetApp) return;

    const now = '21/09/2026 10:15';
    const updatedApps = applications.map((app) => {
      if (app.id === appId) {
        return {
          ...app,
          status: 'OFFICIALLY_RECEIVED' as const,
          officialReceipt: receiptData,
          timeline: [
            ...app.timeline,
            {
              id: `t-${Date.now()}`,
              time: now,
              title: 'Đã tiếp nhận hồ sơ chính thức tại quầy Một cửa',
              actor: officerName,
              description: `Đã đối chiếu hồ sơ giấy và cấp số biên nhận ${receiptData.receiptNumber}`,
              type: 'officer' as const,
              status: 'done' as const,
            },
          ],
        };
      }
      return app;
    });

    setApplications(updatedApps);

    // Audit Log
    const newLog: OfficerAuditLog = {
      id: `log-${Date.now()}`,
      time: now,
      applicationNumber: targetApp.applicationNumber,
      citizenName: targetApp.citizen.fullName,
      action: 'Tiếp nhận chính thức',
      details: `Cấp biên nhận ${receiptData.receiptNumber}, hẹn trả lúc ${receiptData.appointmentDate}`,
      officerName,
      badgeTone: 'success',
    };
    setAuditLogs([newLog, ...auditLogs]);

    toast.success(`Đã tiếp nhận chính thức hồ sơ ${targetApp.applicationNumber}. Cấp biên nhận ${receiptData.receiptNumber}.`);
  };

  // ACTION: Mark all notifications read
  const handleMarkAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    toast.info('Đã đánh dấu đã đọc tất cả thông báo.');
  };

  // Open review from anywhere
  const handleOpenReview = (app: OfficerApplication) => {
    setReviewingApp(app);
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
          if (sec === 'receipt-waiting') {
            setReceiptSubTab('waiting');
          } else if (sec === 'receipt-received') {
            setReceiptSubTab('received');
          }
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
          {/* Priority: If currently in Review Workspace */}
          {reviewingApp ? (
            <OfficerReviewWorkspaceView
              application={reviewingApp}
              onBack={() => setReviewingApp(null)}
              onRequestRevision={handleRequestRevision}
              onApproveApplication={handleApproveApplication}
              onUpdateComments={handleUpdateComments}
            />
          ) : (
            <>
              {/* SECTION 1: DASHBOARD */}
              {activeSection === 'dashboard' && (
                <OfficerDashboardView
                  applications={applications}
                  onSelectSection={(sec) => setActiveSection(sec)}
                  onOpenApplicationReview={handleOpenReview}
                  onQuickPreview={(app) => setQuickPreviewApp(app)}
                />
              )}

              {/* SECTION 2: QUẢN LÝ HỒ SƠ (ALL, PENDING, REVIEWING, NEED REVISION, RESUBMITTED, APPROVED, READY TO SUBMIT) */}
              {(activeSection === 'apps-all' ||
                activeSection === 'apps-pending' ||
                activeSection === 'apps-reviewing' ||
                activeSection === 'apps-need-revision' ||
                activeSection === 'apps-resubmitted' ||
                activeSection === 'apps-approved' ||
                activeSection === 'apps-ready-submit') && (
                <OfficerApplicationListView
                  applications={applications}
                  activeSection={activeSection}
                  onSelectSection={(sec) => setActiveSection(sec)}
                  onOpenReviewWorkspace={handleOpenReview}
                  onTakeApplication={handleTakeApplication}
                  onQuickPreview={(app) => setQuickPreviewApp(app)}
                />
              )}

              {/* SECTION 3: TIẾP NHẬN HỒ SƠ CHÍNH THỨC */}
              {(activeSection === 'receipt-waiting' || activeSection === 'receipt-received') && (
                <OfficerReceiptWorkspaceView
                  applications={applications}
                  activeSubTab={receiptSubTab}
                  onSelectSubTab={(tab) => setReceiptSubTab(tab)}
                  onConfirmReceipt={handleConfirmReceipt}
                  onViewApplication={handleOpenReview}
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
                  onMarkAllAsRead={handleMarkAllNotificationsRead}
                  onSelectApplication={(appNum) => {
                    const target = applications.find((a) => a.applicationNumber === appNum);
                    if (target) handleOpenReview(target);
                  }}
                />
              )}

              {/* SECTION 6: HỒ SƠ CÁ NHÂN & QUẦY TRỰC */}
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
                {quickPreviewApp.status === 'SUBMITTED_FOR_REVIEW' && (
                  <button
                    type="button"
                    onClick={() => {
                      const id = quickPreviewApp.id;
                      setQuickPreviewApp(null);
                      handleTakeApplication(id);
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
    </div>
  );
};
