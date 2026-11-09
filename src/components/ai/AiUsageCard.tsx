import { useMemo, useState } from 'react';
import { ArrowsClockwise } from '@phosphor-icons/react';
import { Button } from '@/components/ui';
import { aiError, type AiUsageDay } from '@/lib/api/aiOcr';
import { useAiUsage } from '@/hooks/useAiKnowledge';
import { addCalendarDays, vietnamToday } from '@/lib/calendarRules';

// Tên dễ hiểu cho từng loại thao tác AI mà backend ghi nhận
const OPERATION_LABELS: Record<string, string> = {
  CHAT: 'Trợ lý hỏi đáp',
  CHAT_RAG: 'Hỏi đáp theo tài liệu nguồn',
  CCCD_EXTRACT: 'Đọc thông tin CCCD',
  DOCUMENT_VERIFY: 'Kiểm tra giấy tờ',
  DOSSIER_ASSIST: 'Kiểm tra sơ bộ hồ sơ bằng AI',
  EMBED_QUERY: 'Chuẩn bị câu hỏi để tìm kiếm',
  EMBED_DOCUMENTS: 'Chuẩn bị tài liệu cho AI',
};
// Hai thao tác chuẩn bị dữ liệu được ghi lại nhưng không tính vào hạn mức ngày
const UNLIMITED = new Set(['EMBED_QUERY', 'EMBED_DOCUMENTS']);

const RANGES = [
  { label: '7 ngày', days: 7 },
  { label: '30 ngày', days: 30 },
  { label: '90 ngày', days: 90 },
] as const;

const num = (value: number) => value.toLocaleString('vi-VN');
const dayLabel = (iso: string) => {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};

type Totals = { success: number; failed: number; rejected: number; totalTokens: number };
const emptyTotals = (): Totals => ({ success: 0, failed: 0, rejected: 0, totalTokens: 0 });
function add(target: Totals, row: AiUsageDay) {
  target.success += row.success;
  target.failed += row.failed;
  target.rejected += row.rejected;
  target.totalTokens += row.totalTokens;
}

function QuotaTile({ label, used, limit, hint }: { label: string; used?: number; limit: number; hint?: string }) {
  const percent = used != null && limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : null;
  const bar = percent == null ? '' : percent >= 90 ? 'bg-red-600' : percent >= 70 ? 'bg-amber-500' : 'bg-emerald-600';
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-lg font-bold text-slate-900">
        {used != null ? <>{num(used)}<span className="text-sm font-medium text-slate-500"> / {num(limit)}</span></> : num(limit)}
      </dd>
      {percent != null && (
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-label={label} aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
          <div className={`h-full rounded-full ${bar}`} style={{ width: `${percent}%` }} />
        </div>
      )}
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

function TotalsCells({ t }: { t: Totals }) {
  return (
    <>
      <td className="px-4 py-2.5 text-right tabular-nums text-emerald-700">{num(t.success)}</td>
      <td className="px-4 py-2.5 text-right tabular-nums text-red-700">{num(t.failed)}</td>
      <td className="px-4 py-2.5 text-right tabular-nums text-amber-700">{num(t.rejected)}</td>
      <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">{num(t.totalTokens)}</td>
    </>
  );
}

const headCells = (
  <>
    <th scope="col" className="px-4 py-2.5 text-right">Thành công</th>
    <th scope="col" className="px-4 py-2.5 text-right">Lỗi</th>
    <th scope="col" className="px-4 py-2.5 text-right" title="Bị chặn do hết lượt trong ngày">Bị từ chối</th>
    <th scope="col" className="px-4 py-2.5 text-right">Token</th>
  </>
);

/** FE-10: Thống kê lượt dùng AI để theo dõi hạn mức Gemini miễn phí (chỉ PM/ADMIN) */
export function AiUsageCard() {
  const [days, setDays] = useState<number>(7);
  const to = vietnamToday();
  const from = addCalendarDays(to, -(days - 1));
  const usage = useAiUsage(from, to);
  const data = usage.data;

  const { byOperation, byDay, grand } = useMemo(() => {
    const ops = new Map<string, Totals>();
    const perDay = new Map<string, Totals>();
    const all = emptyTotals();
    for (const row of data?.days ?? []) {
      if (!ops.has(row.operation)) ops.set(row.operation, emptyTotals());
      if (!perDay.has(row.date)) perDay.set(row.date, emptyTotals());
      add(ops.get(row.operation)!, row);
      add(perDay.get(row.date)!, row);
      add(all, row);
    }
    return {
      byOperation: [...ops.entries()].sort((a, b) => b[1].success + b[1].failed - (a[1].success + a[1].failed)),
      byDay: [...perDay.entries()].sort((a, b) => b[0].localeCompare(a[0])),
      grand: all,
    };
  }, [data]);

  return (
    <section className="admin-card p-5" aria-labelledby="ai-usage-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="ai-usage-title" className="text-base font-bold text-slate-950">Lượt dùng AI</h2>
          <p className="mt-0.5 text-xs text-slate-500">Theo dõi số lượt gọi AI để không vượt hạn mức miễn phí. Ngày tính theo giờ Việt Nam.</p>
        </div>
        <div className="flex items-center gap-2">
          <div role="group" aria-label="Khoảng thời gian" className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
            {RANGES.map(range => (
              <button
                key={range.days}
                type="button"
                aria-pressed={days === range.days}
                onClick={() => setDays(range.days)}
                className={`h-8 rounded-md px-3 text-xs font-semibold transition ${days === range.days ? 'bg-white text-red-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              >
                {range.label}
              </button>
            ))}
          </div>
          <Button variant="outline" size="small" className="h-9 min-h-0 px-3" aria-label="Làm mới thống kê" title="Làm mới thống kê" loading={usage.isFetching} onClick={() => void usage.refetch()}>
            {!usage.isFetching && <ArrowsClockwise size={15} aria-hidden="true" />}
          </Button>
        </div>
      </div>

      {usage.isPending ? (
        <p role="status" className="mt-3 text-sm text-slate-600">Đang tải thống kê…</p>
      ) : usage.isError || !data ? (
        <div role="alert" className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          <span>{aiError(usage.error)}</span>
          <Button variant="outline" size="small" onClick={() => void usage.refetch()}>Thử lại</Button>
        </div>
      ) : (
        <>
          <dl className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <QuotaTile label="Toàn hệ thống hôm nay" used={data.usedToday} limit={data.dailyRequestsTotal} />
            {data.dailyGuestRequestsTotal > 0 && (
              <QuotaTile label="Khách chưa đăng nhập hôm nay" used={data.guestUsedToday} limit={data.dailyGuestRequestsTotal} hint={`Mỗi địa chỉ IP tối đa ${num(data.dailyGuestRequestsPerIp)} lượt/ngày`} />
            )}
            <QuotaTile label="Giới hạn mỗi người dùng/ngày" limit={data.dailyRequestsPerUser} />
            <QuotaTile label="Độ dài tối đa mỗi câu trả lời" limit={data.maxOutputTokens} hint="Tính bằng token" />
          </dl>

          {byOperation.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
              Chưa có lượt dùng AI nào từ {dayLabel(data.from)} đến {dayLabel(data.to)}.
            </p>
          ) : (
            <div className="mt-4 grid gap-4 xl:grid-cols-2">
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full min-w-[480px] text-sm">
                  <caption className="sr-only">Lượt dùng AI theo loại thao tác</caption>
                  <thead><tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th scope="col" className="px-4 py-2.5 text-left">Thao tác</th>{headCells}
                  </tr></thead>
                  <tbody>
                    {byOperation.map(([op, t]) => (
                      <tr key={op} className="border-b border-slate-100 last:border-0">
                        <th scope="row" className="px-4 py-2.5 text-left font-medium text-slate-900">
                          {OPERATION_LABELS[op] ?? op}
                          {UNLIMITED.has(op) && <span className="block text-xs font-normal text-slate-500">Không tính vào hạn mức</span>}
                        </th>
                        <TotalsCells t={t} />
                      </tr>
                    ))}
                  </tbody>
                  <tfoot><tr className="border-t border-slate-200 bg-slate-50 font-semibold">
                    <th scope="row" className="px-4 py-2.5 text-left text-slate-900">Tổng cộng</th>
                    <TotalsCells t={grand} />
                  </tr></tfoot>
                </table>
              </div>
              <div className="max-h-80 overflow-auto rounded-xl border border-slate-200">
                <table className="w-full min-w-[440px] text-sm">
                  <caption className="sr-only">Lượt dùng AI theo ngày</caption>
                  <thead className="sticky top-0"><tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th scope="col" className="px-4 py-2.5 text-left">Ngày</th>{headCells}
                  </tr></thead>
                  <tbody>
                    {byDay.map(([date, t]) => (
                      <tr key={date} className="border-b border-slate-100 last:border-0">
                        <th scope="row" className="whitespace-nowrap px-4 py-2.5 text-left font-medium text-slate-900">{dayLabel(date)}</th>
                        <TotalsCells t={t} />
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
