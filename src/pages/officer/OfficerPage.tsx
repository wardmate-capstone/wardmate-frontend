import React, { useState } from 'react';
import {
  House,
  Files,
  FileText,
  Books,
} from '@phosphor-icons/react';
import { AdminLayoutShell, type NavGroup } from '@/components/layout/AdminLayoutShell';
import { OfficerDashboard } from './OfficerDashboard';
import { OfficerApplicationList } from './OfficerApplicationList';
import { OfficerReviewWorkspace } from './OfficerReviewWorkspace';
import { INITIAL_APPLICATIONS } from '@/data/mockApplications';
import type { Application, ApplicationStatus } from '@/types/application';
import { toast } from 'sonner';

export const OfficerPage: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>(INITIAL_APPLICATIONS);
  const [activeSection, setActiveSection] = useState<'dashboard' | 'applications' | 'workspace'>('dashboard');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  // Status updates handler
  const handleUpdateStatus = (
    applicationId: string,
    newStatus: ApplicationStatus,
    options?: {
      revisionNote?: string;
      internalNote?: string;
      generatedQr?: string;
    }
  ) => {
    setApplications((prev) =>
      prev.map((app) => {
        if (app.id !== applicationId) return app;
        return {
          ...app,
          status: newStatus,
          reviewStartedAt: app.reviewStartedAt || new Date().toLocaleString('vi-VN'),
          reviewedBy: app.reviewedBy || 'Lê Thu Hà (Cán bộ Một cửa)',
          reviewedAt: newStatus === 'APPROVED' || newStatus === 'NEED_REVISION' ? new Date().toLocaleString('vi-VN') : app.reviewedAt,
          qrCodeUrl: options?.generatedQr || app.qrCodeUrl,
          internalNotes: options?.internalNote || app.internalNotes,
        };
      })
    );
  };

  const handleSelectApplication = (app: Application) => {
    // If opening a SUBMITTED_FOR_REVIEW application, automatically transition to UNDER_REVIEW
    if (app.status === 'SUBMITTED_FOR_REVIEW') {
      handleUpdateStatus(app.id, 'UNDER_REVIEW');
      setSelectedApp({
        ...app,
        status: 'UNDER_REVIEW',
        reviewStartedAt: new Date().toLocaleString('vi-VN'),
        reviewedBy: 'Lê Thu Hà (Cán bộ Một cửa)',
      });
      toast.info(`Hồ sơ ${app.applicationNumber} đã được chuyển sang trạng thái "Đang tiền kiểm".`);
    } else {
      setSelectedApp(app);
    }
    setActiveSection('workspace');
  };

  // Nav Groups
  const pendingCount = applications.filter((a) => a.status === 'SUBMITTED_FOR_REVIEW').length;
  const navGroups: NavGroup[] = [
    {
      title: 'Nghiệp vụ tiền kiểm',
      items: [
        {
          id: 'dashboard',
          label: 'Bàn làm việc tổng quan',
          icon: House,
        },
        {
          id: 'applications',
          label: 'Danh sách hồ sơ',
          icon: Files,
          badge: pendingCount > 0 ? pendingCount : undefined,
          badgeColor: 'bg-red-800 text-white',
        },
      ],
    },
    {
      title: 'Tra cứu & Nghiệp vụ',
      items: [
        {
          id: 'forms',
          label: 'Kho biểu mẫu chuẩn',
          icon: FileText,
          onClick: () => toast.info('Đang mở kho biểu mẫu tiêu chuẩn Bộ Tư pháp.'),
        },
        {
          id: 'legal',
          label: 'Cơ sở pháp lý & RAG AI',
          icon: Books,
          onClick: () => toast.info('Đang mở tra cứu quy định pháp lý hành chính.'),
        },
      ],
    },
  ];

  return (
    <AdminLayoutShell
      currentRole="officer"
      roleTitle="Cán bộ Một cửa"
      userName="Lê Thu Hà"
      userAvatar="TH"
      userEmail="thuha.le@wardmate.vn"
      navGroups={navGroups}
      activeNavId={activeSection === 'workspace' ? 'applications' : activeSection}
      onSelectNav={(id) => {
        if (id === 'dashboard') {
          setSelectedApp(null);
          setActiveSection('dashboard');
        } else if (id === 'applications') {
          setSelectedApp(null);
          setActiveSection('applications');
        }
      }}
      title={
        activeSection === 'dashboard'
          ? 'Bàn Làm Việc Cán Bộ Một Cửa'
          : activeSection === 'applications'
          ? 'Quản Lý Hồ Sơ Tiền Kiểm'
          : 'Không Gian Tiền Kiểm Hồ Sơ'
      }
      subtitle={
        activeSection === 'dashboard'
          ? 'UBND Phường An Khánh • Bộ phận Tiếp nhận và Trả kết quả'
          : activeSection === 'applications'
          ? 'Tiếp nhận, kiểm tra điều kiện, checklist, biểu mẫu và duyệt cấp mã QR'
          : selectedApp
          ? `Đang rà soát chi tiết hồ sơ ${selectedApp.applicationNumber}`
          : undefined
      }
      breadcrumbs={
        activeSection === 'workspace'
          ? [
              { label: 'Cán bộ Một cửa', onClick: () => setActiveSection('dashboard') },
              { label: 'Danh sách hồ sơ', onClick: () => setActiveSection('applications') },
              { label: selectedApp?.applicationNumber || 'Kiểm tra' },
            ]
          : activeSection === 'applications'
          ? [
              { label: 'Cán bộ Một cửa', onClick: () => setActiveSection('dashboard') },
              { label: 'Danh sách hồ sơ' },
            ]
          : [{ label: 'Cán bộ Một cửa' }, { label: 'Bàn làm việc' }]
      }
      headerActions={
        activeSection === 'dashboard' ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveSection('applications')}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-red-800 text-white font-bold text-xs hover:bg-red-900 shadow-xs transition-all cursor-pointer"
            >
              <span>Xem toàn bộ hồ sơ</span>
            </button>
          </div>
        ) : undefined
      }
    >
      {activeSection === 'dashboard' && (
        <OfficerDashboard
          applications={applications}
          onSelectApplication={handleSelectApplication}
          onViewAllApplications={() => setActiveSection('applications')}
        />
      )}

      {activeSection === 'applications' && (
        <OfficerApplicationList
          applications={applications}
          onSelectApplication={handleSelectApplication}
        />
      )}

      {activeSection === 'workspace' && selectedApp && (
        <OfficerReviewWorkspace
          application={selectedApp}
          onBack={() => setActiveSection('applications')}
          onUpdateStatus={handleUpdateStatus}
        />
      )}
    </AdminLayoutShell>
  );
};
