import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AnalyticsTrendChart } from './AnalyticsTrendChart';
import { useAnalytics } from '@/hooks/useAnalytics';
import { analyticsApi, initialAnalyticsQuery, type deadlinesSchema } from '@/lib/api/analytics';
import type { z } from 'zod';
import { AnalyticsFilters, AnalyticsPagination, AnalyticsStatus, CoverageNotice } from './AnalyticsFilters';
import { procedureApi } from '@/lib/api/procedures';
import { getManagerOfficers } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';

const labels = { receivedCount: 'Lượt gửi tiền kiểm', readyCount: 'Giấy tờ sẵn sàng', revisionRequestedCount: 'Lượt yêu cầu bổ sung', resubmittedCount: 'Lượt gửi lại', cancelledCount: 'Hồ sơ đã hủy' } as const;
function metric(value: number | null | undefined, suffix = '') { return value == null ? 'Chưa đủ dữ liệu' : value.toLocaleString('vi-VN', { maximumFractionDigits: 2 }) + suffix; }
function Deadlines({ value }: { value?: z.infer<typeof deadlinesSchema> | null }) {
  if (!value) return <p>Chưa có dữ liệu hạn tiền kiểm.</p>;
  return <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[
    ['Đúng hạn (đã sẵn sàng)', metric(value.onTimeRate, '%')], ['Quá hạn (đã sẵn sàng)', metric(value.lateRate, '%')], ['Số mẫu có hạn', value.completedSampleCount], ['Đang tồn quá hạn', value.openOverdue], ['Đang tạm dừng', value.openPaused], ['Đã sẵn sàng, thiếu hạn', value.completedMissingDeadline], ['Đang tồn, thiếu hạn', value.openMissingDeadline],
  ].map(([label, val]) => <div key={label} className="rounded-xl border border-slate-200 p-3"><dt className="text-sm text-slate-600">{label}</dt><dd className="mt-1 font-bold">{val}</dd></div>)}</dl>;
}
function ProcedureName({ id }: { id: string }) {
  const query = useQuery({ queryKey: ['procedure-name', id], queryFn: ({ signal }) => procedureApi.detail(id, signal), retry: false });
  return <span>{query.data?.title ?? `Thủ tục ${id}`}</span>;
}
function OfficerName({ id }: { id: string }) {
  const userId = useAuthStore(state => state.user?.id);
  const query = useQuery({ queryKey: ['analytics', userId, 'officer-directory'], queryFn: () => getManagerOfficers({ page: 1, pageSize: 100 }), retry: false });
  const officer = query.data?.items.find(item => item.id === id);
  return <span>{officer?.fullName || officer?.username || `Cán bộ ${id}`}</span>;
}
export function ManagerAnalyticsView({ section }: { section: string }) {
  const [filters, setFilters] = useState(initialAnalyticsQuery);
  const unavailable = section === 'stats-searches' || section === 'stats-forms';
  const procedures = section === 'stats-procedures';
  const officers = section === 'perf-officers' || section === 'perf-processing-time';
  const feedback = section === 'feedback-reports';
  const summary = section === 'satisfaction-level';
  const overviewEnabled = !unavailable && !procedures && !officers && !feedback && !summary;
  const overview = useAnalytics('overview', analyticsApi.overview, filters, overviewEnabled);
  const trends = useAnalytics('trends', analyticsApi.trends, filters, section === 'stats-dossiers');
  const procedureRows = useAnalytics('procedures', analyticsApi.procedures, filters, procedures);
  const officerRows = useAnalytics('officers', analyticsApi.officers, filters, officers);
  const feedbackRows = useAnalytics('feedback', analyticsApi.feedback, filters, feedback);
  const feedbackSummary = useAnalytics('summary', analyticsApi.summary, filters, summary);
  const current = procedures ? procedureRows : officers ? officerRows : feedback ? feedbackRows : summary ? feedbackSummary : overview;
  const pageData = procedures ? procedureRows.data : officers ? officerRows.data : feedback ? feedbackRows.data : undefined;
  if (unavailable) return <div className="admin-card p-6" role="status">{section === 'stats-searches' ? 'API thống kê lưu lượng tra cứu sẽ được tích hợp sau.' : 'API thống kê biểu mẫu trực tuyến sẽ được tích hợp sau.'} Backend hiện chưa cung cấp dữ liệu cho mục này.</div>;
  return <div className="space-y-5"><AnalyticsFilters value={filters} onChange={setFilters} /><Button variant="outline" loading={current.isFetching || (section === 'stats-dossiers' && trends.isFetching)} onClick={() => { void current.refetch(); if (section === 'stats-dossiers') void trends.refetch(); }}>Làm mới dữ liệu</Button><AnalyticsStatus pending={current.isPending} error={current.error} retry={() => void current.refetch()} />
    {!current.isError && current.data && <section className="admin-card space-y-5 p-5">
      {overviewEnabled && overview.data && <><h2 className="font-bold">Kết quả tiền kiểm trong kỳ</h2>{section === 'perf-supplement-rate' && <p>Backend cung cấp số lượt yêu cầu bổ sung; chưa có tỷ lệ hồ sơ hoặc phân tích nguyên nhân bổ sung.</p>}<dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{Object.entries(labels).map(([key, label]) => <div key={key} className="rounded-xl bg-slate-50 p-4"><dt className="text-sm text-slate-600">{label}</dt><dd className="mt-2 text-2xl font-bold text-red-900">{overview.data!.totals[key as keyof typeof labels].toLocaleString('vi-VN')}</dd></div>)}</dl><Deadlines value={overview.data.deadlines} /><CoverageNotice data={overview.data.coverage} /></>}
      {procedures && procedureRows.data && <><h2 className="font-bold">Thống kê theo thủ tục</h2><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr>{['Thủ tục', 'Lượt gửi', 'Sẵn sàng', 'Yêu cầu bổ sung', 'Đúng hạn', 'Đang tồn quá hạn'].map(label => <th className="p-3" key={label}>{label}</th>)}</tr></thead><tbody>{procedureRows.data.items.map(row => <tr key={row.procedureId} className="border-t border-slate-200"><td className="p-3"><ProcedureName id={row.procedureId} /></td><td className="p-3">{row.totals.receivedCount}</td><td className="p-3">{row.totals.readyCount}</td><td className="p-3">{row.totals.revisionRequestedCount}</td><td className="p-3">{metric(row.deadlines?.onTimeRate, '%')}</td><td className="p-3">{metric(row.deadlines?.openOverdue)}</td></tr>)}</tbody></table></div><CoverageNotice data={procedureRows.data.coverage} /></>}
      {officers && officerRows.data && <><h2 className="font-bold">Hiệu suất tiền kiểm theo cán bộ</h2><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr>{['Cán bộ', 'Sẵn sàng', 'Yêu cầu bổ sung', 'Trung bình (phút)', 'Số mẫu thời gian', 'Đúng hạn', 'Đang tồn quá hạn'].map(label => <th className="p-3" key={label}>{label}</th>)}</tr></thead><tbody>{officerRows.data.items.map(row => <tr key={row.officerId} className="border-t border-slate-200"><td className="p-3"><OfficerName id={row.officerId} /></td><td className="p-3">{row.readyCount}</td><td className="p-3">{row.revisionRequestedCount}</td><td className="p-3">{metric(row.averageElapsedMinutes)}</td><td className="p-3">{row.durationSampleCount}</td><td className="p-3">{metric(row.deadlines?.onTimeRate, '%')}</td><td className="p-3">{metric(row.deadlines?.openOverdue)}</td></tr>)}</tbody></table></div><h3 className="font-semibold">Hồ sơ chưa phân công cán bộ</h3><Deadlines value={officerRows.data.unassignedDeadlines} /><CoverageNotice data={officerRows.data.coverage} /></>}
      {feedback && feedbackRows.data && <><h2 className="font-bold">Phản hồi người dân</h2><div className="space-y-3">{feedbackRows.data.items.map(row => <article key={row.id} className="rounded-xl border border-slate-200 p-4"><p className="font-semibold">{row.rating}/5 sao</p><p className="break-all text-sm text-slate-600">Hồ sơ: {row.applicationId} · {new Date(row.createdAtUtc).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</p><p className="mt-2 whitespace-pre-wrap break-words">{row.comment || 'Không có góp ý thêm.'}</p></article>)}</div></>}
      {summary && feedbackSummary.data && <><h2 className="font-bold">Mức độ hài lòng</h2><p>{feedbackSummary.data.totalCount} đánh giá · Trung bình: {metric(feedbackSummary.data.averageRating, '/5')} · Hài lòng (4–5 sao): {metric(feedbackSummary.data.satisfactionRate, '%')}</p><ul className="space-y-3">{Object.entries(feedbackSummary.data.ratingCounts).map(([star, value]) => <li key={star} className="flex items-center gap-3"><span>{star} sao</span><meter className="h-5 flex-1" min={0} max={Math.max(1, feedbackSummary.data!.totalCount)} value={value} aria-label={`${star} sao: ${value} đánh giá`} /><span>{value}</span></li>)}</ul></>}
      {pageData && <>{pageData.items.length === 0 && <p role="status">Không có dữ liệu trong kỳ đã chọn.</p>}<AnalyticsPagination page={pageData.page} size={pageData.pageSize} total={pageData.totalCount} onChange={page => setFilters(previous => ({ ...previous, page }))} /></>}
    </section>}
    {section === 'stats-dossiers' && <section className="admin-card space-y-4 p-5"><h2 className="font-bold">Xu hướng tiền kiểm theo ngày</h2><AnalyticsStatus pending={trends.isPending} error={trends.error} retry={() => void trends.refetch()} />{!trends.isError && trends.data && <><CoverageNotice data={trends.data.coverage} /><AnalyticsTrendChart data={trends.data} /><h3 className="font-semibold">Hồ sơ còn tồn tại thời điểm thống kê</h3><Deadlines value={trends.data.currentBacklog} /></>}</section>}
  </div>;
}
