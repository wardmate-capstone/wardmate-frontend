import { useEffect, type ComponentType } from 'react';
import { useSearchParams } from 'react-router-dom';
import { X } from '@phosphor-icons/react';
import { BrandMark } from '@/components/brand/BrandMark';
import { BrandWordmark } from '@/components/brand/BrandWordmark';
import { useAuthStore } from '@/stores/authStore';
import { canAccessItem, hasAnyPermission, type WorkspaceId } from '@/lib/navigationAccess';
import { PermissionFeatureContent, permissionFeatures } from './PermissionFeatures';

type NavIcon = ComponentType<{ size?: number; className?: string; 'aria-hidden'?: boolean }>;

export type WorkspaceNavItem<Section extends string> = {
  id: Section;
  label: string;
  icon: NavIcon;
  badge?: string | number;
  permissions?: string[];
  fallbackRoles?: string[];
};

export type WorkspaceNavGroup<Section extends string> = { title: string; items: WorkspaceNavItem<Section>[] };

export function WorkspaceSidebar<Section extends string>({ workspace, subtitle, activeSection, groups, onSelectSection, isOpen, onClose, isCompact }: {
  workspace: WorkspaceId;
  subtitle: string;
  activeSection: Section;
  groups: WorkspaceNavGroup<Section>[];
  onSelectSection: (section: Section) => void;
  isOpen: boolean;
  onClose: () => void;
  isCompact: boolean;
}) {
  const [params, setParams] = useSearchParams();
  const user = useAuthStore(state => state.user);
  const roles = user?.roles ?? [];
  const permissions = user?.permissions ?? [];
  const visibleGroups = groups.map(group => ({ ...group, items: group.items.filter(item => canAccessItem(roles, permissions, item.permissions, item.fallbackRoles)) })).filter(group => group.items.length);
  const coveredRules = groups.flatMap(group => group.items.flatMap(item => item.permissions ?? []));
  const grantedFeatures = permissionFeatures.filter(feature => hasAnyPermission(permissions, feature.permissions) && !feature.permissions.some(permission => permissions.includes(permission) && coveredRules.some(rule => rule.endsWith('.') ? permission.startsWith(rule) : permission === rule)));
  const activeFeature = permissionFeatures.find(feature => feature.id === params.get('feature') && hasAnyPermission(permissions, feature.permissions));
  const sidebarId = `${workspace}-sidebar`;
  const select = (section: Section) => { setParams(current => { const next = new URLSearchParams(current); next.delete('feature'); return next; }); onSelectSection(section); onClose(); };
  const selectFeature = (id: string) => { setParams(current => { const next = new URLSearchParams(current); next.set('feature', id); return next; }); onClose(); };
  const closeFeature = () => setParams(current => { const next = new URLSearchParams(current); next.delete('feature'); return next; });
  useEffect(() => {
    if (!activeFeature) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = overflow; };
  }, [activeFeature]);

  return <>
    {isOpen && <button type="button" className="admin-sidebar-overlay" onClick={onClose} aria-label="Đóng menu điều hướng" />}
    <aside id={sidebarId} className={`admin-sidebar ${isOpen ? 'is-open' : ''} ${isCompact ? 'is-compact' : ''}`} aria-label="Điều hướng chức năng">
      <div className="admin-brand"><BrandMark className="admin-brand-mark" size={42} /><div><BrandWordmark subtitle={subtitle} compact /></div><button type="button" onClick={onClose} aria-label="Đóng menu"><X size={21} /></button></div>
      <nav className="admin-nav">
        {visibleGroups.map(group => <div className="admin-nav-section" key={group.title}><p>{group.title}</p>{group.items.map(({ id, label, icon: Icon, badge }) => <button key={id} type="button" className={activeSection === id ? 'is-active' : ''} aria-current={activeSection === id ? 'page' : undefined} onClick={() => select(id)} title={isCompact ? label : undefined}><Icon size={20} aria-hidden /><span>{label}</span>{badge !== undefined && badge !== 0 && <small>{badge}</small>}</button>)}</div>)}
        {grantedFeatures.length > 0 && <div className="admin-nav-section"><p>Chức năng được cấp</p>{grantedFeatures.map(feature => { const Icon = feature.icon; return <button key={feature.id} type="button" className={activeFeature?.id === feature.id ? 'is-active' : ''} aria-current={activeFeature?.id === feature.id ? 'page' : undefined} onClick={() => selectFeature(feature.id)} title={isCompact ? feature.label : undefined}><Icon size={20} aria-hidden /><span>{feature.label}</span></button>; })}</div>}
      </nav>
    </aside>
    {activeFeature && <div className={`fixed bottom-0 left-0 right-0 top-[4.5rem] z-30 flex flex-col overflow-hidden bg-slate-50 ${isCompact ? 'lg:left-20' : 'lg:left-72'}`}><header className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 py-3 sm:px-6"><div><h1 className="text-lg font-bold text-slate-950">{activeFeature.label}</h1><p className="text-xs text-slate-500">Chức năng được cấp theo quyền IAM</p></div><button type="button" aria-label="Đóng chức năng" className="grid size-10 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100" onClick={closeFeature}><X size={20} /></button></header><main className="admin-main flex-1 overflow-auto py-5"><PermissionFeatureContent feature={activeFeature} /></main></div>}
  </>;
}
