import { useEffect, useState, type ComponentType } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CaretDown, X } from '@phosphor-icons/react';
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
  children?: WorkspaceNavItem<Section>[];
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
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const user = useAuthStore(state => state.user);
  const roles = user?.roles ?? [];
  const permissions = user?.permissions ?? [];
  const visibleGroups = groups.map(group => ({
    ...group,
    items: group.items
      .map(item => ({ ...item, children: item.children?.filter(child => canAccessItem(roles, permissions, child.permissions, child.fallbackRoles)) }))
      .filter(item => (item.children?.length ?? 0) > 0 || canAccessItem(roles, permissions, item.permissions, item.fallbackRoles)),
  })).filter(group => group.items.length);
  const activeFeature = permissionFeatures.find(feature => feature.id === params.get('feature') && hasAnyPermission(permissions, feature.permissions));
  const sidebarId = `${workspace}-sidebar`;
  const select = (section: Section) => { setParams(current => { const next = new URLSearchParams(current); next.delete('feature'); return next; }); onSelectSection(section); onClose(); };
  useEffect(() => {
    if (!activeFeature) return;
    const bodyOverflow = document.body.style.overflow;
    const rootOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = bodyOverflow;
      document.documentElement.style.overflow = rootOverflow;
    };
  }, [activeFeature]);

  return <>
    {isOpen && <button type="button" className="admin-sidebar-overlay" onClick={onClose} aria-label="Đóng menu điều hướng" />}
    <aside id={sidebarId} className={`admin-sidebar workspace-sidebar workspace-sidebar-${workspace} ${isOpen ? 'is-open' : ''} ${isCompact ? 'is-compact' : ''}`} aria-label={`Thanh điều hướng ${subtitle}`}>
      <div className="admin-brand"><BrandMark className="admin-brand-mark" size={42} /><div><BrandWordmark subtitle={subtitle} compact /></div><button type="button" onClick={onClose} aria-label="Đóng menu"><X size={21} /></button></div>
      <nav className="admin-nav">
        {visibleGroups.map(group => <div className="admin-nav-section" key={group.title}><p>{group.title}</p>{group.items.map(({ id, label, icon: Icon, badge, children }) => {
          const childActive = children?.some(child => child.id === activeSection) ?? false;
          const expanded = expandedItems[String(id)] ?? true;
          if (children?.length) return <div className="workspace-nav-tree" key={id}>
            <button type="button" className={`admin-nav-parent ${childActive ? 'is-active' : ''}`} aria-expanded={expanded} onClick={() => setExpandedItems(current => ({ ...current, [String(id)]: !expanded }))} title={isCompact ? label : undefined}><Icon size={20} aria-hidden /><span>{label}</span>{badge !== undefined && badge !== 0 && <small aria-hidden="true">{badge}</small>}<CaretDown size={14} className={expanded ? '' : '-rotate-90'} aria-hidden /></button>
            {(expanded || isCompact) && <div className="admin-subnav-tree">{children.map(({ id: childId, label: childLabel, icon: ChildIcon, badge: childBadge }) => <button key={childId} type="button" className={`admin-subnav-btn ${activeSection === childId ? 'is-active' : ''}`} aria-current={activeSection === childId ? 'page' : undefined} onClick={() => select(childId)} title={isCompact ? childLabel : undefined}>{ChildIcon && <ChildIcon size={16} aria-hidden />}<span>{childLabel}</span>{childBadge !== undefined && childBadge !== 0 && <small aria-hidden="true">{childBadge}</small>}</button>)}</div>}
          </div>;
          return <button key={id} type="button" className={activeSection === id ? 'is-active' : ''} aria-current={activeSection === id ? 'page' : undefined} onClick={() => select(id)} title={isCompact ? label : undefined}><Icon size={20} aria-hidden /><span>{label}</span>{badge !== undefined && badge !== 0 && <small aria-hidden="true">{badge}</small>}</button>;
        })}</div>)}
      </nav>
    </aside>
    {activeFeature && <section data-permission-feature-panel aria-label={activeFeature.label} className={`fixed bottom-0 left-0 right-0 top-[72px] z-20 flex min-w-0 overflow-hidden bg-slate-50 ${isCompact ? 'lg:left-20' : 'lg:left-72'}`}><main className="admin-main min-w-0 flex-1 overflow-y-auto overflow-x-hidden py-5"><PermissionFeatureContent feature={activeFeature} /></main></section>}
  </>;
}
