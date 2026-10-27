import { useRef, useState } from 'react';
import { ArrowRight, Bell, BellSlash, CheckCircle, Checks, CircleNotch, WifiSlash } from '@phosphor-icons/react';
import { Button } from '@/components/ui';
import { formatNotificationTime } from '@/lib/formatTime';
import type { NotificationDto } from '@/lib/api/notifications';
import type { NotificationConnectionStatus } from '@/hooks/useNotificationHub';

interface CitizenNotificationsViewProps {
  notifications: NotificationDto[];
  connectionStatus: NotificationConnectionStatus;
  onMarkAllRead: () => Promise<void>;
  onMarkRead: (id: string) => Promise<void>;
  onOpenApplication: (id: string) => Promise<void>;
}

export function CitizenNotificationsView({ notifications, connectionStatus, onMarkAllRead, onMarkRead, onOpenApplication }: CitizenNotificationsViewProps) {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState('');
  const lock = useRef(false);
  const unread = notifications.filter(item => !item.isRead).length;
  const visible = filter === 'unread' ? notifications.filter(item => !item.isRead) : notifications;
  const connected = connectionStatus === 'connected';
  const connecting = connectionStatus === 'connecting';
  const known = connected || notifications.length > 0;

  async function perform(key: string, action: () => Promise<void>) {
    if (lock.current) return;
    lock.current = true;
    setPending(key);
    setError('');
    try { await action(); }
    catch { setError(key.startsWith('open:') ? 'Chưa mở được hồ sơ. Vui lòng thử lại.' : 'Chưa đánh dấu được thông báo. Vui lòng thử lại.'); }
    finally { lock.current = false; setPending(null); }
  }

  return (
    <section aria-label="Hộp thư thông báo" className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-4 sm:p-6">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-red-50 text-red-800"><Bell size={24} weight="duotone" aria-hidden="true" /></span>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-slate-950 sm:text-lg">Thông báo hồ sơ</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">Theo dõi tiến độ tiền kiểm và yêu cầu bổ sung giấy tờ.</p>
            </div>
          </div>
          <Button variant="outline" size="small" className="min-h-11 w-full sm:w-auto" disabled={!connected || !unread || pending !== null} loading={pending === 'all'} onClick={() => void perform('all', onMarkAllRead)}>
            <Checks size={18} aria-hidden="true" /> Đánh dấu tất cả đã đọc
          </Button>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div role="group" aria-label="Lọc thông báo" className="flex flex-wrap gap-2">
            {(['all', 'unread'] as const).map(value => <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)} className={`min-h-11 rounded-xl px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold-200 ${filter === value ? 'bg-red-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {value === 'all' ? 'Tất cả' : 'Chưa đọc'}{known ? ` (${value === 'all' ? notifications.length : unread})` : ''}
            </button>)}
          </div>
          <p role="status" className={`flex items-center gap-2 text-xs ${connected ? 'text-emerald-700' : 'text-slate-500'}`}>
            {connected ? <CheckCircle size={16} aria-hidden="true" /> : connecting ? <CircleNotch size={16} className="animate-spin" aria-hidden="true" /> : <WifiSlash size={16} aria-hidden="true" />}
            {connected ? 'Đã cập nhật thông báo' : connecting ? 'Đang tải thông báo…' : 'Chưa kết nối được máy chủ thông báo'}
          </p>
        </div>
      </div>
      {connectionStatus === 'offline' && <div role="alert" className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
        <WifiSlash size={20} className="mt-0.5 shrink-0" aria-hidden="true" />
        <p>Hệ thống sẽ tự kết nối lại. {notifications.length ? 'Bạn vẫn có thể xem thông báo đã tải và mở hồ sơ; việc đánh dấu đã đọc sẽ khả dụng khi kết nối trở lại.' : 'Thông báo sẽ xuất hiện khi kết nối thành công.'}</p>
      </div>}
      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs" aria-busy={connecting}>
        {visible.length > 0 ? <ul aria-label="Danh sách thông báo" className="divide-y divide-slate-100">
          {visible.map(item => <li key={item.id} className={`p-4 sm:p-6 ${item.isRead ? 'bg-white' : 'bg-red-50/40'}`}>
            <div className="flex items-start gap-3 sm:gap-4">
              <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${item.isRead ? 'bg-slate-100 text-slate-500' : 'bg-red-100 text-red-800'}`}><Bell size={20} aria-hidden="true" /></span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <h3 className="min-w-0 max-w-full break-words text-sm font-bold leading-6 text-slate-900">{item.title}</h3>
                  {!item.isRead && <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-800">Chưa đọc</span>}
                </div>
                <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">{item.content}</p>
                <time dateTime={item.createdAt} className="mt-2 block text-xs text-slate-500">{formatNotificationTime(item.createdAt)}</time>
                <div className="mt-3 flex flex-wrap gap-2">
                  {item.applicationId && <Button variant="outline" size="small" className="min-h-11" disabled={pending !== null} loading={pending === `open:${item.id}`} onClick={() => void perform(`open:${item.id}`, async () => {
                    if (!item.isRead && connected) await onMarkRead(item.id);
                    await onOpenApplication(item.applicationId!);
                  })}>Mở hồ sơ <ArrowRight size={16} aria-hidden="true" /></Button>}
                  {!item.isRead && <Button variant="ghost" size="small" className="min-h-11" disabled={!connected || pending !== null} loading={pending === item.id} onClick={() => void perform(item.id, () => onMarkRead(item.id))}><Checks size={16} aria-hidden="true" /> Đánh dấu đã đọc</Button>}
                </div>
              </div>
            </div>
          </li>)}
        </ul> : <div className="flex min-h-80 flex-col items-center justify-center px-5 py-10 text-center sm:py-14">
          <span className="mb-4 grid size-16 place-items-center rounded-2xl bg-slate-50 text-slate-400">
            {connecting ? <CircleNotch size={30} className="animate-spin" aria-hidden="true" /> : connectionStatus === 'offline' ? <WifiSlash size={30} aria-hidden="true" /> : <BellSlash size={30} weight="duotone" aria-hidden="true" />}
          </span>
          <h3 className="text-base font-bold text-slate-900">{connecting ? 'Đang lấy thông báo của bạn' : connectionStatus === 'offline' ? 'Chưa tải được thông báo' : filter === 'unread' ? 'Bạn đã đọc hết thông báo trong danh sách' : 'Bạn chưa có thông báo'}</h3>
          <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">{connecting ? 'Vui lòng chờ trong giây lát.' : connectionStatus === 'offline' ? 'Kết nối đang gián đoạn. Dữ liệu chưa tải được sẽ không hiển thị tại đây.' : filter === 'unread' ? 'Chuyển sang Tất cả để xem lại các cập nhật trước đó.' : 'Khi hồ sơ có cập nhật hoặc cần bổ sung giấy tờ, thông báo sẽ xuất hiện tại đây.'}</p>
          {filter === 'unread' && connected && <Button variant="ghost" size="small" className="mt-4 min-h-11" onClick={() => setFilter('all')}>Xem tất cả thông báo</Button>}
        </div>}
        {notifications.length > 0 && <p className="border-t border-slate-100 px-4 py-3 text-xs leading-5 text-slate-500 sm:px-6">Bạn đang xem các thông báo gần nhất. Đánh dấu tất cả chỉ áp dụng cho các thông báo đã tải.</p>}
      </div>
    </section>
  );
}
