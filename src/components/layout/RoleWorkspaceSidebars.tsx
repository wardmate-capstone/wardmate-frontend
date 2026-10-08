import { ArrowCounterClockwise, Bell, Brain, CheckCircle, ClipboardText, Clock, ClockCounterClockwise, FileText, Files, FolderOpen, House, Hourglass, IdentificationCard, LinkBreak, LinkSimple, ListChecks, MagnifyingGlass, Path, Scales, ThumbsUp, Tray, UploadSimple, UserCircle, UsersThree, WarningCircle } from '@phosphor-icons/react';
import type { OfficerSection } from '@/types/officer';
import type { ManagerSectionId } from '@/pages/manager/types';
import { WorkspaceSidebar, type WorkspaceNavGroup } from './WorkspaceSidebar';

export type ProcedureNavSection = 'dashboard' | 'procedures' | 'drafts' | 'categories' | 'checklists' | 'steps' | 'forms' | 'upload-form' | 'form-versions' | 'attach-forms' | 'legal-docs' | 'procedure-legal-links' | 'ai-knowledge' | 'audit-logs' | 'profile';

type CommonProps<Section extends string> = { currentSection: Section; onSelectSection: (section: Section) => void; isOpenMobile: boolean; onCloseMobile: () => void; isCollapsedDesktop: boolean };

export function UnifiedManagerSidebar({ currentSection, onSelectSection, isOpenMobile, onCloseMobile, isCollapsedDesktop }: CommonProps<ManagerSectionId> & { profilesCount?: number; onToggleCollapseDesktop?: () => void }) {
  const role = ['MANAGER'];
  const groups: WorkspaceNavGroup<ManagerSectionId>[] = [
    { title: 'Thống kê hệ thống', items: [
      { id: 'stats-dossiers', label: 'Thống kê hồ sơ', icon: Files, fallbackRoles: role }, { id: 'stats-procedures', label: 'Thống kê thủ tục', icon: ClipboardText, fallbackRoles: role },
      { id: 'stats-searches', label: 'Thống kê lượt tra cứu', icon: MagnifyingGlass, fallbackRoles: role }, { id: 'stats-forms', label: 'Thống kê biểu mẫu', icon: FileText, fallbackRoles: role },
    ] },
    { title: 'Nhân sự Một cửa', items: [{ id: 'profiles', label: 'Cán bộ Một cửa', icon: IdentificationCard, fallbackRoles: role }] },
    { title: 'Hiệu suất xử lý', items: [
      { id: 'perf-processing-time', label: 'Thời gian xử lý', icon: Clock, fallbackRoles: role }, { id: 'perf-completion-rate', label: 'Tỷ lệ hoàn thành', icon: CheckCircle, fallbackRoles: role },
      { id: 'perf-supplement-rate', label: 'Tỷ lệ cần bổ sung', icon: WarningCircle, fallbackRoles: role }, { id: 'perf-officers', label: 'Hiệu suất cán bộ', icon: UsersThree, fallbackRoles: role },
    ] },
    { title: 'Phản hồi người dân', items: [{ id: 'feedback-reports', label: 'Báo cáo phản hồi', icon: Bell, fallbackRoles: role }, { id: 'satisfaction-level', label: 'Mức độ hài lòng', icon: ThumbsUp, fallbackRoles: role }] },
    { title: 'Tài khoản', items: [{ id: 'profile', label: 'Hồ sơ cá nhân', icon: UserCircle, permissions: ['iam.profile.read', 'iam.profile.write'] }] },
  ];
  return <WorkspaceSidebar workspace="manager" subtitle="Quản lý điều hành" activeSection={currentSection} groups={groups} onSelectSection={onSelectSection} isOpen={isOpenMobile} onClose={onCloseMobile} isCompact={isCollapsedDesktop} />;
}

export function UnifiedOfficerSidebar({ activeSection, onSelectSection, isOpen, onClose, isCompact }: { activeSection: OfficerSection; onSelectSection: (section: OfficerSection) => void; isOpen: boolean; onClose: () => void; isCompact: boolean; badgeCounts?: { pending: number; reviewing: number; needRevision: number; resubmitted: number; approved: number; readySubmit: number; receivedToday: number; unreadNotifs: number } }) {
  const role = ['FRONT_DESK_OFFICER'];
  const groups: WorkspaceNavGroup<OfficerSection>[] = [
    { title: 'Tổng quan', items: [{ id: 'dashboard', label: 'Tổng quan', icon: House, fallbackRoles: role }] },
    { title: 'Quản lý hồ sơ', items: [{ id: 'apps-all', label: 'Hồ sơ nghiệp vụ', icon: Files, children: [
      { id: 'apps-all', label: 'Tất cả hồ sơ', icon: Files, fallbackRoles: role }, { id: 'apps-pending', label: 'Chờ tiền kiểm', icon: Hourglass, fallbackRoles: role },
      { id: 'apps-reviewing', label: 'Đang kiểm tra', icon: ClockCounterClockwise, fallbackRoles: role }, { id: 'apps-need-revision', label: 'Cần bổ sung', icon: WarningCircle, fallbackRoles: role },
      { id: 'apps-resubmitted', label: 'Đã gửi lại', icon: ArrowCounterClockwise, fallbackRoles: role }, { id: 'apps-approved', label: 'Đã duyệt tiền kiểm', icon: CheckCircle, fallbackRoles: role },
      { id: 'apps-ready-submit', label: 'Chờ tiếp nhận chính thức', icon: FileText, fallbackRoles: role },
    ] }] },
    { title: 'Tiếp nhận hồ sơ', items: [{ id: 'receipt-waiting', label: 'Chờ tiếp nhận', icon: ClipboardText, fallbackRoles: role }, { id: 'receipt-received', label: 'Đã tiếp nhận', icon: Tray, fallbackRoles: role }] },
    { title: 'Hệ thống & Ca trực', items: [{ id: 'audit-log', label: 'Lịch sử xử lý', icon: ClockCounterClockwise, fallbackRoles: role }, { id: 'notifications', label: 'Thông báo', icon: Bell, fallbackRoles: role }, { id: 'profile', label: 'Hồ sơ cá nhân', icon: UserCircle, permissions: ['iam.profile.read', 'iam.profile.write'] }] },
  ];
  return <WorkspaceSidebar workspace="officer" subtitle="Cán bộ Một cửa" activeSection={activeSection} groups={groups} onSelectSection={onSelectSection} isOpen={isOpen} onClose={onClose} isCompact={isCompact} />;
}

export function UnifiedProcedureSidebar({ currentSection, onSelectSection, isOpenMobile, onCloseMobile, isCollapsedDesktop }: CommonProps<ProcedureNavSection> & { publishedCount?: number; activeFormsCount?: number; onToggleCollapseDesktop?: () => void }) {
  const role = ['PROCEDURE_MANAGER', 'IT_ADMIN'];
  const groups: WorkspaceNavGroup<ProcedureNavSection>[] = [
    { title: 'Tổng quan', items: [{ id: 'dashboard', label: 'Tổng quan', icon: House, permissions: ['procedure.', 'document.templates.'], fallbackRoles: role }] },
    { title: 'Thủ tục hành chính', items: [
      { id: 'procedures', label: 'Danh sách thủ tục', icon: ClipboardText, permissions: ['procedure.read', 'procedure.create', 'procedure.update', 'procedure.publish', 'procedure.status'] },
      { id: 'drafts', label: 'Nhập PDF & bản nháp', icon: FolderOpen, permissions: ['procedure.drafts.'] }, { id: 'categories', label: 'Danh mục thủ tục', icon: ListChecks, permissions: ['procedure.categories.manage'] },
      { id: 'checklists', label: 'Thành phần hồ sơ', icon: ListChecks, fallbackRoles: role }, { id: 'steps', label: 'Quy trình thực hiện', icon: Path, fallbackRoles: role },
    ] },
    { title: 'Biểu mẫu', items: [
      { id: 'forms', label: 'Danh sách biểu mẫu', icon: FileText, permissions: ['document.templates.read', 'document.templates.manage'] }, { id: 'upload-form', label: 'Upload biểu mẫu', icon: UploadSimple, permissions: ['document.templates.manage'] },
      { id: 'form-versions', label: 'Phiên bản biểu mẫu', icon: ClockCounterClockwise, fallbackRoles: role }, { id: 'attach-forms', label: 'Gắn biểu mẫu vào thủ tục', icon: LinkSimple, fallbackRoles: role },
    ] },
    { title: 'Pháp lý & AI', items: [{ id: 'legal-docs', label: 'Văn bản pháp lý', icon: Scales, fallbackRoles: role }, { id: 'procedure-legal-links', label: 'Liên kết thủ tục - VB', icon: LinkBreak, fallbackRoles: role }, { id: 'ai-knowledge', label: 'Dữ liệu kiến thức AI', icon: Brain, fallbackRoles: role }] },
    { title: 'Hệ thống', items: [{ id: 'audit-logs', label: 'Lịch sử cập nhật', icon: ClockCounterClockwise, permissions: ['procedure.versions.read'] }, { id: 'profile', label: 'Hồ sơ cá nhân', icon: UserCircle, permissions: ['iam.profile.read', 'iam.profile.write'] }] },
  ];
  return <WorkspaceSidebar workspace="procedure-manager" subtitle="Quản lý thủ tục" activeSection={currentSection} groups={groups} onSelectSection={onSelectSection} isOpen={isOpenMobile} onClose={onCloseMobile} isCompact={isCollapsedDesktop} />;
}
