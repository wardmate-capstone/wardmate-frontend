import { useRef, useState } from 'react';
import { ArrowRight, Bell, BellSlash, Checks, CircleNotch, WifiSlash } from '@phosphor-icons/react';
import { Button, Pagination, ErrorAlert } from '@/components/ui';
import { formatNotificationTime } from '@/lib/formatTime';
import type { NotificationDto } from '@/lib/api/notifications';
import type { NotificationConnectionStatus } from '@/hooks/useNotificationHub';

interface CitizenNotificationsViewProps {
  notifications: NotificationDto[];
  connectionStatus: NotificationConnectionStatus;
  onMarkAllRead: () => Promise<void>;
  /** Số chưa đọc từ server (gồm cả thông báo chưa tải về); bỏ trống thì đếm trong danh sách */
  unreadCount?: number;
  onMarkRead: (id: string) => Promise<void>;
  onOpenApplication: (id: string) => Promise<void>;
}

// Màu icon theo tiêu đề (chỉ phục vụ hiển thị): cần xử lý → đỏ, đã sẵn sàng → xanh lá, đang tiền kiểm → xanh dương
function notificationTone(title: string): string {
  const text = title.toLowerCase();
  if (/bổ sung|chỉnh sửa|từ chối|hủy/.test(text)) return 'bg-red-50 text-red-700';
  if (/sẵn sàng|duyệt|hoàn|tiếp nhận/.test(text)) return 'bg-emerald-50 text-emerald-700';
  if (/kiểm tra|tiền kiểm|nộp|gửi/.test(text)) return 'bg-sky-50 text-sky-700';
  return 'bg-slate-100 text-slate-500';
}

const PAGE_SIZE = 10;

export function CitizenNotificationsView({ notifications, connectionStatus, onMarkAllRead, unreadCount, onMarkRead, onOpenApplication }: CitizenNotificationsViewProps) {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState('');
  const lock = useRef(false);
  const unread = notifications.filter(item => !item.isRead).length;
  const visible = filter === 'unread' ? notifications.filter(item => !item.isRead) : notifications;
  // Phân trang phía client: mỗi trang 10 thông báo
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = visible.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const changeFilter = (value: 'all' | 'unread') => { setFilter(value); setPage(1); };
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

  // Nhóm thông báo theo mốc thời gian để dễ dò
  const groups = (() => {
    const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);
    const weekAgo = startOfToday.getTime() - 6 * 86_400_000;
    const buckets: { label: string; items: NotificationDto[] }[] = [
      { label: 'Hôm nay', items: [] }, { label: '7 ngày qua', items: [] }, { label: 'Cũ hơn', items: [] },
    ];
    for (const item of pageItems) {
      const time = new Date(item.createdAt).getTime();
      buckets[isNaN(time) || time < weekAgo ? 2 : time >= startOfToday.getTime() ? 0 : 1].items.push(item);
    }
    return buckets.filter(bucket => bucket.items.length);
  })();

  return (
    <section aria-label="Hộp thư thông báo" className="space-y-4">
      {/* Thanh công cụ: lọc + đánh dấu tất cả */}
      <div className="flex flex-wrap items-center gap-3">
        <div role="group" aria-label="Lọc thông báo" className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-2xs">
          {(['all', 'unread'] as const).map(value => {
            const label = value === 'all' ? 'Tất cả' : 'Chưa đọc';
            const count = value === 'all' ? notifications.length : unread;
            const active = filter === value;
            return <button key={value} type="button" aria-pressed={active} aria-label={known ? `${label} (${count})` : label} onClick={() => changeFilter(value)} className={`inline-flex h-9 items-center gap-2 rounded-lg px-3.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-800 focus-visible:ring-offset-2 ${active ? 'bg-red-800 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
              {label}
              {known && <span className={`rounded-full px-1.5 text-xs ${active ? 'bg-white/20' : 'bg-slate-100 text-slate-500'}`}>{count}</span>}
            </button>;
          })}
        </div>
        {!connected && <p role="status" className="flex items-center gap-1.5 text-xs text-slate-500">
          {connecting ? <CircleNotch size={14} className="animate-spin" aria-hidden="true" /> : <WifiSlash size={14} aria-hidden="true" />}
          {connecting ? 'Đang tải thông báo…' : 'Chưa cập nhật được thông báo mới'}
        </p>}
        <button type="button" className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-red-800 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:text-slate-400 disabled:hover:bg-transparent" disabled={!connected || !(unread || unreadCount) || pending !== null} onClick={() => void perform('all', onMarkAllRead)}>
          {pending === 'all' ? <CircleNotch size={16} className="animate-spin" aria-hidden="true" /> : <Checks size={16} aria-hidden="true" />} Đánh dấu tất cả đã đọc
        </button>
      </div>
      {connectionStatus === 'offline' && <div role="alert" className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
        <WifiSlash size={20} className="mt-0.5 shrink-0" aria-hidden="true" />
        <p>Hệ thống sẽ tự kết nối lại. {notifications.length ? 'Bạn vẫn có thể xem các thông báo đang hiển thị và mở hồ sơ; việc đánh dấu đã đọc sẽ dùng được khi kết nối trở lại.' : 'Thông báo sẽ xuất hiện khi kết nối thành công.'}</p>
      </div>}
      {error && <ErrorAlert>{error}</ErrorAlert>}
      <div aria-busy={connecting}>
        {visible.length > 0 ? <div aria-label="Danh sách thông báo" className="space-y-5">
          {groups.map(group => <div key={group.label}>
            <h3 className="mb-2.5 text-xs font-bold uppercase tracking-wider text-slate-500">{group.label}</h3>
            <ul className="space-y-3">
              {group.items.map(item => {
                const tone = notificationTone(item.title);
                return <li key={item.id} className={`relative overflow-hidden rounded-2xl border bg-white p-4 shadow-2xs transition hover:shadow-sm sm:p-5 ${item.isRead ? 'border-slate-200' : 'border-red-200'}`}>
                  {/* Viền trái đỏ đánh dấu thông báo chưa đọc */}
                  {!item.isRead && <span className="absolute inset-y-0 left-0 w-1 bg-red-700" aria-hidden="true" />}
                  <div className="flex items-start gap-4">
                    <span className={`grid size-12 shrink-0 place-items-center rounded-xl ${tone}`}><Bell size={24} weight="duotone" aria-hidden="true" /></span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
                        <h4 className={`min-w-0 break-words text-base leading-6 ${item.isRead ? 'font-semibold text-slate-800' : 'font-bold text-slate-950'}`}>
                          {item.title}
                          {!item.isRead && <span className="ml-2 inline-block size-2 -translate-y-0.5 rounded-full bg-red-600 align-middle" aria-hidden="true" />}
                          {!item.isRead && <span className="sr-only"> (chưa đọc)</span>}
                        </h4>
                        <time dateTime={item.createdAt} className="shrink-0 text-sm text-slate-500">{formatNotificationTime(item.createdAt)}</time>
                      </div>
                      <p className="mt-1.5 whitespace-pre-wrap break-words text-[15px] leading-6 text-slate-600">{item.content}</p>
                      {(item.applicationId || !item.isRead) && <div className="mt-4 flex flex-wrap items-center gap-2">
                        {item.applicationId && <Button size="small" className="min-h-10 gap-1.5" disabled={pending !== null} loading={pending === `open:${item.id}`} onClick={() => void perform(`open:${item.id}`, async () => {
                          if (!item.isRead && connected) await onMarkRead(item.id);
                          await onOpenApplication(item.applicationId!);
                        })}>Mở hồ sơ <ArrowRight size={16} weight="bold" aria-hidden="true" /></Button>}
                        {!item.isRead && <Button variant="ghost" size="small" className="min-h-10 gap-1.5 text-slate-600" disabled={!connected || pending !== null} loading={pending === item.id} onClick={() => void perform(item.id, () => onMarkRead(item.id))}><Checks size={16} aria-hidden="true" /> Đánh dấu đã đọc</Button>}
                      </div>}
                    </div>
                  </div>
                </li>;
              })}
            </ul>
          </div>)}
        </div> : <div className="flex min-h-80 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-10 text-center shadow-2xs sm:py-14">
          <span className="mb-4 grid size-16 place-items-center rounded-2xl bg-slate-50 text-slate-400">
            {connecting ? <CircleNotch size={30} className="animate-spin" aria-hidden="true" /> : connectionStatus === 'offline' ? <WifiSlash size={30} aria-hidden="true" /> : <BellSlash size={30} weight="duotone" aria-hidden="true" />}
          </span>
          <h3 className="text-base font-bold text-slate-900">{connecting ? 'Đang lấy thông báo của bạn' : connectionStatus === 'offline' ? 'Chưa tải được thông báo' : filter === 'unread' ? 'Bạn đã đọc hết thông báo trong danh sách' : 'Bạn chưa có thông báo'}</h3>
          <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">{connecting ? 'Vui lòng chờ trong giây lát.' : connectionStatus === 'offline' ? 'Kết nối đang gián đoạn. Dữ liệu chưa tải được sẽ không hiển thị tại đây.' : filter === 'unread' ? 'Chuyển sang Tất cả để xem lại các cập nhật trước đó.' : 'Khi hồ sơ có cập nhật hoặc cần bổ sung giấy tờ, thông báo sẽ xuất hiện tại đây.'}</p>
          {filter === 'unread' && connected && <Button variant="ghost" size="small" className="mt-4 min-h-11" onClick={() => changeFilter('all')}>Xem tất cả thông báo</Button>}
        </div>}
        {totalPages > 1 && <Pagination
          className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-2xs sm:px-5"
          label="Phân trang thông báo"
          page={currentPage}
          total={visible.length}
          pageSize={PAGE_SIZE}
          unit="thông báo"
          onPageChange={setPage}
        />}
        {notifications.length > 0 && <p className="mt-3 text-xs leading-5 text-slate-500">Bạn đang xem các thông báo gần nhất.</p>}
      </div>
    </section>
  );
}
