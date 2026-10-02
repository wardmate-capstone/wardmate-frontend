import { UserDropdown } from '@/components/layout/UserDropdown';
import React from 'react';
import {
  List,
  SidebarSimple,
  Bell,
  Plus,
  MagnifyingGlass,
} from '@phosphor-icons/react';
import { ProcedureNavSection } from './ProcedureManagerSidebar';

interface ProcedureManagerHeaderProps {
  onOpenMobileSidebar: () => void;
  onAddNewProcedure?: () => void;
  isCollapsedDesktop: boolean;
  onToggleCollapseDesktop: () => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}

export const sectionTitles: Record<ProcedureNavSection, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Tổng quan Quản lý Thủ tục',
    subtitle: 'Theo dõi 45 thủ tục công khai, 12 biểu mẫu hiện hành và trạng thái đồng bộ tri thức AI'
  },
  procedures: {
    title: 'Danh sách Thủ tục Hành chính',
    subtitle: 'Quản lý vòng đời, xuất bản, biểu mẫu và cấu hình E-form cho từng thủ tục'
  },
  categories: {
    title: 'Danh mục Thủ tục',
    subtitle: 'Phân loại các lĩnh vực hành chính cấp xã/phường (Hộ tịch, Đất đai, Chứng thực...)'
  },
  checklists: {
    title: 'Thành phần Hồ sơ (Checklist Templates)',
    subtitle: 'Quản lý các mẫu danh mục thành phần hồ sơ giấy tờ chuẩn hóa dùng chung'
  },
  steps: {
    title: 'Quy trình Thực hiện Mẫu',
    subtitle: 'Thiết kế các bước xử lý từ nộp hồ sơ, tiền kiểm đến tiếp nhận chính thức'
  },
  forms: {
    title: 'Kho Biểu mẫu Hành chính',
    subtitle: 'Quản lý các tệp PDF trống, file Word và mẫu điền minh họa kèm theo thủ tục'
  },
  'upload-form': {
    title: 'Tải lên biểu mẫu',
    subtitle: 'Tải lên biểu mẫu Word (.doc/.docx) hoặc PDF và thiết lập thời hạn hiệu lực'
  },
  'form-versions': {
    title: 'Lịch sử Phiên bản Biểu mẫu',
    subtitle: 'Theo dõi vòng đời V1, V2, V3 và quản lý thay đổi quy chuẩn biểu mẫu'
  },
  'attach-forms': {
    title: 'Gắn Biểu mẫu vào Thủ tục Hành chính',
    subtitle: 'Thiết lập danh mục biểu mẫu bắt buộc áp dụng khi công dân nộp hồ sơ'
  },
  'legal-docs': {
    title: 'Văn bản Quy phạm Pháp luật',
    subtitle: 'Kho văn bản Luật, Nghị định, Thông tư làm cơ sở pháp lý cho các thủ tục'
  },
  'procedure-legal-links': {
    title: 'Liên kết Thủ tục - Căn cứ Pháp lý',
    subtitle: 'Rà soát và thiết lập mối quan hệ điều chỉnh giữa văn bản pháp lý và thủ tục'
  },
  'ai-knowledge': {
    title: 'Dữ liệu Tri thức AI (RAG Knowledge)',
    subtitle: 'Giám sát và đồng bộ hóa dữ liệu văn bản, FAQ vào hệ thống trả lời tự động'
  },
  'audit-logs': {
    title: 'Lịch sử Cập nhật & Kiểm toán',
    subtitle: 'Nhật ký theo dõi mọi thay đổi về thủ tục, biểu mẫu, lệ phí và phiên bản'
  },
  profile: {
    title: 'Hồ sơ Chuyên viên Quản lý',
    subtitle: 'Thông tin phân quyền, chữ ký số nội bộ và tài khoản quản trị nghiệp vụ'
  }
};

export const ProcedureManagerHeader: React.FC<ProcedureManagerHeaderProps> = ({
  onOpenMobileSidebar, isCollapsedDesktop, onToggleCollapseDesktop,
  searchQuery = '', onSearchChange, onAddNewProcedure
}) => (
  <header className="admin-topbar">
    <button type="button" className="admin-menu-toggle" onClick={onOpenMobileSidebar} aria-label="Mở menu điều hướng" aria-controls="procedure-manager-sidebar"><List size={23} /></button>
    <button type="button" className={`admin-collapse-button ${isCollapsedDesktop ? 'is-collapsed' : ''}`} onClick={onToggleCollapseDesktop} aria-label="Thu gọn hoặc mở rộng thanh điều hướng" aria-controls="procedure-manager-sidebar" aria-expanded={!isCollapsedDesktop}><SidebarSimple size={21} /></button>
    {onSearchChange && <div className="relative hidden md:block">
      <MagnifyingGlass size={17} className="absolute left-3 top-3 text-slate-400" />
      <input aria-label="Tìm thủ tục, mã" value={searchQuery} onChange={e => onSearchChange(e.target.value)} placeholder="Tìm thủ tục, mã..." className="h-11 w-52 rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs" />
    </div>}
    {onAddNewProcedure && <button type="button" className="admin-primary-action" onClick={onAddNewProcedure}><Plus size={18} /><span>Thêm thủ tục</span></button>}
    <div className="admin-topbar-actions">
      <button type="button" aria-label="Thông báo hệ thống"><Bell size={21} /><span>•</span></button>
      <UserDropdown />
    </div>
  </header>
);
