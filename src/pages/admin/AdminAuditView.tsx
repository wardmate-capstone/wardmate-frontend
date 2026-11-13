import { useId, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { AdminRbacAuditView } from './AdminRbacViews';
import { BusinessAuditEventsView } from './BusinessAuditEventsView';
import { SystemAuditLogsView } from './SystemAuditLogsView';

export type AdminAuditTab = 'events' | 'settings' | 'iam';
const tabs: { id: AdminAuditTab; label: string }[] = [
  { id: 'events', label: 'Nghiệp vụ toàn hệ thống' }, { id: 'settings', label: 'Thay đổi cấu hình' }, { id: 'iam', label: 'Phân quyền' },
];
export function AdminAuditView({ tab, onTab }: { tab: AdminAuditTab; onTab: (tab: AdminAuditTab) => void }) {
  const user = useAuthStore(state => state.user);
  const id = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  if (!user?.roles.includes('IT_ADMIN')) return <p role="alert">Bạn không có quyền quản trị hệ thống.</p>;
  const visible = tabs.filter(item => item.id !== 'iam' || user.permissions.includes('iam.audit.read'));
  const current = visible.some(item => item.id === tab) ? tab : 'events';
  return <div className="min-w-0 space-y-5"><div role="tablist" aria-label="Loại nhật ký" className="flex flex-wrap gap-2">{visible.map((item, index) => <button ref={element => { refs.current[index] = element; }} key={item.id} type="button" role="tab" id={`${id}-${item.id}`} aria-controls={`${id}-panel-${item.id}`} aria-selected={current === item.id} tabIndex={current === item.id ? 0 : -1}
    onClick={() => onTab(item.id)} onKeyDown={event => {
      let next = index;
      if (event.key === 'ArrowRight') next = (index + 1) % visible.length;
      else if (event.key === 'ArrowLeft') next = (index - 1 + visible.length) % visible.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = visible.length - 1;
      else return;
      event.preventDefault(); refs.current[next]?.focus(); onTab(visible[next].id);
    }} className={`min-h-12 rounded-xl border px-4 py-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-800 focus-visible:ring-offset-2 ${current === item.id ? 'border-red-800 bg-red-800 text-white' : 'border-slate-200 bg-white text-slate-700'}`}>{item.label}</button>)}</div>
    {visible.map(item => <div key={item.id} role="tabpanel" id={`${id}-panel-${item.id}`} aria-labelledby={`${id}-${item.id}`} hidden={current !== item.id} tabIndex={0} className="min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-800 focus-visible:ring-offset-2">
      {current === item.id && (item.id === 'events' ? <BusinessAuditEventsView /> : item.id === 'settings' ? <SystemAuditLogsView /> : <AdminRbacAuditView />)}
    </div>)}</div>;
}
