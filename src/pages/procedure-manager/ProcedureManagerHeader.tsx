import { UserDropdown } from '@/components/layout/UserDropdown';
import React from 'react';
import {
  List,
  SidebarSimple,
  Plus,
} from '@phosphor-icons/react';
import { SearchInput } from '@/components/ui';
import type { ProcedureNavSection } from '@/components/layout/RoleWorkspaceSidebars';

interface ProcedureManagerHeaderProps {
  onOpenMobileSidebar: () => void;
  onAddNewProcedure?: () => void;
  isCollapsedDesktop: boolean;
  onToggleCollapseDesktop: () => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  /** Tên màn hiện tại cho breadcrumb (giống Admin/Manager). */
  currentTitle?: string;
}

export const sectionTitles: Record<ProcedureNavSection, { title: string }> = {
  dashboard: {
    title: 'Tổng quan'
  },
  procedures: {
    title: 'Danh sách thủ tục'
  },
  drafts: {
    title: 'PDF và bản nháp'
  },
  categories: {
    title: 'Danh mục thủ tục'
  },
  checklists: {
    title: 'Thành phần hồ sơ'
  },
  steps: {
    title: 'Quy trình thực hiện mẫu'
  },
  forms: {
    title: 'Danh sách biểu mẫu'
  },
  'upload-form': {
    title: 'Tải lên biểu mẫu'
  },
  'form-versions': {
    title: 'Lịch sử phiên bản biểu mẫu'
  },
  'attach-forms': {
    title: 'Gắn biểu mẫu vào thủ tục'
  },
  'legal-docs': {
    title: 'Văn bản quy phạm pháp luật'
  },
  'procedure-legal-links': {
    title: 'Liên kết thủ tục – căn cứ pháp lý'
  },
  'ai-knowledge': {
    title: 'Dữ liệu kiến thức AI'
  },
  'audit-logs': {
    title: 'Lịch sử cập nhật'
  },
  profile: {
    title: 'Hồ sơ cá nhân'
  }
};

export const ProcedureManagerHeader: React.FC<ProcedureManagerHeaderProps> = ({
  onOpenMobileSidebar, isCollapsedDesktop, onToggleCollapseDesktop,
  searchQuery = '', onSearchChange, onAddNewProcedure, currentTitle
}) => (
  <header className="admin-topbar">
    <button type="button" className="admin-menu-toggle" onClick={onOpenMobileSidebar} aria-label="Mở menu điều hướng" aria-controls="procedure-manager-sidebar"><List size={23} /></button>
    <button type="button" className={`admin-collapse-button ${isCollapsedDesktop ? 'is-collapsed' : ''}`} onClick={onToggleCollapseDesktop} aria-label="Thu gọn hoặc mở rộng thanh điều hướng" aria-controls="procedure-manager-sidebar" aria-expanded={!isCollapsedDesktop}><SidebarSimple size={21} /></button>
    {currentTitle && <div className="admin-breadcrumb"><span>Quản lý thủ tục</span><span aria-hidden="true">/</span><strong>{currentTitle}</strong></div>}
    {onSearchChange && <SearchInput containerClassName="hidden w-56 md:block" aria-label="Tìm thủ tục, mã" value={searchQuery} onChange={e => onSearchChange(e.target.value)} onClear={() => onSearchChange('')} placeholder="Tìm thủ tục, mã..." />}
    {onAddNewProcedure && <button type="button" className="admin-primary-action" onClick={onAddNewProcedure}><Plus size={16} /><span>Thêm thủ tục</span></button>}
    <div className="admin-topbar-actions">
      <UserDropdown />
    </div>
  </header>
);
