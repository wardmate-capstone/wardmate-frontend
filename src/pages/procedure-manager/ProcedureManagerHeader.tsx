import { UserDropdown } from '@/components/layout/UserDropdown';
import React from 'react';
import {
  List,
  SidebarSimple,
  Plus,
  MagnifyingGlass,
} from '@phosphor-icons/react';
import type { ProcedureNavSection } from '@/components/layout/RoleWorkspaceSidebars';

interface ProcedureManagerHeaderProps {
  onOpenMobileSidebar: () => void;
  onAddNewProcedure?: () => void;
  isCollapsedDesktop: boolean;
  onToggleCollapseDesktop: () => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}

export const sectionTitles: Record<ProcedureNavSection, { title: string }> = {
  dashboard: {
    title: 'Tổng quan Quản lý Thủ tục'
  },
  procedures: {
    title: 'Danh sách Thủ tục Hành chính'
  },
  drafts: {
    title: 'PDF & Bản nháp Thủ tục'
  },
  categories: {
    title: 'Danh mục Thủ tục'
  },
  checklists: {
    title: 'Thành phần Hồ sơ'
  },
  steps: {
    title: 'Quy trình Thực hiện Mẫu'
  },
  forms: {
    title: 'Kho Biểu mẫu Hành chính'
  },
  'upload-form': {
    title: 'Tải lên biểu mẫu'
  },
  'form-versions': {
    title: 'Lịch sử Phiên bản Biểu mẫu'
  },
  'attach-forms': {
    title: 'Gắn Biểu mẫu vào Thủ tục Hành chính'
  },
  'legal-docs': {
    title: 'Văn bản Quy phạm Pháp luật'
  },
  'procedure-legal-links': {
    title: 'Liên kết Thủ tục - Căn cứ Pháp lý'
  },
  'ai-knowledge': {
    title: 'Nguồn kiến thức'
  },
  'audit-logs': {
    title: 'Lịch sử cập nhật'
  },
  profile: {
    title: 'Hồ sơ Chuyên viên Quản lý'
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
      <UserDropdown />
    </div>
  </header>
);
