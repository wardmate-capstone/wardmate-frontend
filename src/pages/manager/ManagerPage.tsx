import React, { useState } from 'react';
import {
  House,
  ClipboardText,
  Users,
  ChatDots,
  FileArrowDown,
  Printer,
} from '@phosphor-icons/react';
import { AdminLayoutShell, type NavGroup } from '@/components/layout/AdminLayoutShell';
import { ManagerDashboard } from './ManagerDashboard';
import { ProcedureAnalytics } from './ProcedureAnalytics';
import { OfficerPerformance } from './OfficerPerformance';
import { CitizenFeedbackView } from './CitizenFeedbackView';
import { toast } from 'sonner';

type ManagerSection = 'dashboard' | 'procedures' | 'officers' | 'feedback';

export const ManagerPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState<ManagerSection>('dashboard');

  const navGroups: NavGroup[] = [
    {
      title: 'Báo cáo & Điều hành',
      items: [
        {
          id: 'dashboard',
          label: 'Trung tâm điều hành',
          icon: House,
        },
        {
          id: 'procedures',
          label: 'Phân tích thủ tục',
          icon: ClipboardText,
        },
        {
          id: 'officers',
          label: 'Hiệu suất cán bộ',
          icon: Users,
        },
        {
          id: 'feedback',
          label: 'Ý kiến công dân',
          icon: ChatDots,
        },
      ],
    },
    {
      title: 'Vận hành & Kết xuất',
      items: [
        {
          id: 'export-excel',
          label: 'Xuất báo cáo số liệu',
          icon: FileArrowDown,
          onClick: () => toast.success('Đang tạo báo cáo thống kê định kỳ...'),
        },
        {
          id: 'print-report',
          label: 'In báo cáo giao ban',
          icon: Printer,
          onClick: () => window.print(),
        },
      ],
    },
  ];

  const titles: Record<ManagerSection, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Báo Cáo & Thống Kê Điều Hành',
      subtitle: 'UBND Phường An Khánh • Theo dõi thời gian thực tiến độ tiếp nhận & giải quyết thủ tục',
    },
    procedures: {
      title: 'Thống Kê Theo Danh Mục Thủ Tục',
      subtitle: 'Phân tích tần suất hồ sơ, tỷ lệ đạt tiền kiểm và lỗi thường gặp',
    },
    officers: {
      title: 'Đánh Giá Hiệu Suất Cán Bộ Một Cửa',
      subtitle: 'Năng suất thụ lý, thời gian xử lý trung bình và tỷ lệ đúng hạn của từng cán bộ',
    },
    feedback: {
      title: 'Khảo Sát Hài Lòng & Ý Kiến Công Dân',
      subtitle: 'Đánh giá chất lượng phục vụ và hướng dẫn tiền kiểm theo phản hồi thực tế',
    },
  };

  return (
    <AdminLayoutShell
      currentRole="manager"
      roleTitle="Lãnh đạo / Quản lý"
      userName="Trần Quốc Bảo"
      userAvatar="QB"
      userEmail="quocbao.tran@wardmate.vn"
      navGroups={navGroups}
      activeNavId={activeSection}
      onSelectNav={(id) => {
        if (id === 'dashboard' || id === 'procedures' || id === 'officers' || id === 'feedback') {
          setActiveSection(id);
        }
      }}
      title={titles[activeSection].title}
      subtitle={titles[activeSection].subtitle}
      breadcrumbs={[
        { label: 'Lãnh đạo / Quản lý', onClick: () => setActiveSection('dashboard') },
        { label: titles[activeSection].title },
      ]}
      headerActions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => toast.success('Đã tải xuống tệp dữ liệu báo cáo (.xlsx)')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
          >
            <FileArrowDown size={16} />
            <span>Xuất Excel</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-red-800 hover:bg-red-900 rounded-xl transition-colors shadow-xs cursor-pointer"
          >
            <Printer size={16} />
            <span>In báo cáo</span>
          </button>
        </div>
      }
    >
      {activeSection === 'dashboard' && <ManagerDashboard onNavigateTab={(tab) => setActiveSection(tab as ManagerSection)} />}
      {activeSection === 'procedures' && <ProcedureAnalytics />}
      {activeSection === 'officers' && <OfficerPerformance />}
      {activeSection === 'feedback' && <CitizenFeedbackView />}
    </AdminLayoutShell>
  );
};
