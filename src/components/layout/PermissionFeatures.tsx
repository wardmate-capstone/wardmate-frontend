import { lazy, Suspense, type ComponentType } from 'react';
import { ClockCounterClockwise, ClipboardText, FileText, FolderOpen, Key, ListChecks, UserCircle, Users, Buildings } from '@phosphor-icons/react';
import { AdminRbacAuditView, AdminRolesView } from '@/pages/admin/AdminRbacViews';
import { UnifiedSelfProfileView } from '@/components/profile/UnifiedSelfProfileView';

const EmbeddedAdmin = lazy(() => import('@/pages/admin/AdminPage').then(module => ({ default: module.AdminPage })));
const EmbeddedProcedureManager = lazy(() => import('@/pages/procedure-manager/ProcedureManagerPage').then(module => ({ default: module.ProcedureManagerPage })));
const EmbeddedCitizen = lazy(() => import('@/pages/citizen/CitizenPage').then(module => ({ default: module.CitizenPage })));

type FeatureIcon = ComponentType<{ size?: number; 'aria-hidden'?: boolean }>;

export type PermissionFeature = {
  id: string;
  label: string;
  icon: FeatureIcon;
  permissions: string[];
};

export const permissionFeatures: PermissionFeature[] = [
  { id: 'iam-accounts', label: 'Người dùng hệ thống', icon: Users, permissions: ['iam.manage', 'iam.accounts.read', 'iam.accounts.manage'] },
  { id: 'iam-wards', label: 'Đơn vị Phường / Xã', icon: Buildings, permissions: ['iam.wards.read', 'iam.wards.manage'] },
  { id: 'iam-rbac', label: 'Vai trò & quyền hạn', icon: Key, permissions: ['iam.rbac.manage'] },
  { id: 'iam-audit', label: 'Nhật ký hoạt động', icon: ClockCounterClockwise, permissions: ['iam.audit.read'] },
  { id: 'procedure-catalog', label: 'Thủ tục hành chính', icon: ClipboardText, permissions: ['procedure.read', 'procedure.create', 'procedure.update', 'procedure.publish', 'procedure.status'] },
  { id: 'procedure-history', label: 'Lịch sử phiên bản', icon: ClockCounterClockwise, permissions: ['procedure.versions.read', 'procedure.rollback', 'procedure.source.read'] },
  { id: 'procedure-categories', label: 'Danh mục thủ tục', icon: ListChecks, permissions: ['procedure.categories.manage'] },
  { id: 'procedure-drafts', label: 'PDF & bản nháp', icon: FolderOpen, permissions: ['procedure.drafts.read', 'procedure.drafts.upload', 'procedure.drafts.update', 'procedure.drafts.extract', 'procedure.drafts.publish', 'procedure.drafts.delete'] },
  { id: 'document-templates', label: 'Biểu mẫu điện tử', icon: FileText, permissions: ['document.templates.read', 'document.templates.manage'] },
  { id: 'document-submissions', label: 'Đơn điện tử của tôi', icon: FileText, permissions: ['document.submissions.read', 'document.submissions.write', 'document.submissions.submit', 'document.submissions.download'] },
  { id: 'profile', label: 'Hồ sơ cá nhân', icon: UserCircle, permissions: ['iam.profile.read', 'iam.profile.write'] },
];

export function PermissionFeatureContent({ feature }: { feature: PermissionFeature }) {
  if (feature.id === 'iam-audit') return <AdminRbacAuditView />;
  if (feature.id === 'iam-rbac') return <AdminRolesView />;
  if (feature.id === 'profile') return <UnifiedSelfProfileView />;
  const content = feature.id === 'iam-accounts' ? <EmbeddedAdmin embedded initialSection="users" />
    : feature.id === 'iam-wards' ? <EmbeddedAdmin embedded initialSection="wards" />
      : ['procedure-catalog', 'procedure-history'].includes(feature.id) ? <EmbeddedProcedureManager embedded initialSection="procedures" />
        : feature.id === 'procedure-categories' ? <EmbeddedProcedureManager embedded initialSection="categories" />
          : feature.id === 'procedure-drafts' ? <EmbeddedProcedureManager embedded initialSection="drafts" />
            : feature.id === 'document-templates' ? <EmbeddedProcedureManager embedded initialSection="forms" />
              : feature.id === 'document-submissions' ? <EmbeddedCitizen embedded initialSection="dossiers_all" />
                : null;
  return <Suspense fallback={<p role="status" className="p-8 text-center text-sm">Đang tải chức năng...</p>}>{content}</Suspense>;
}
