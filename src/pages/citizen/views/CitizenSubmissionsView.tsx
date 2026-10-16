import { lazy, Suspense, useState } from 'react';
import { Button, Modal } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { useCitizenSubmissions } from '@/hooks/useDocumentForms';
import { documentFormApi, documentFormError, submissionStatusLabel, type UserSubmissionDto } from '@/lib/api/documentForms';

const DocxOnlineEditor = lazy(() => import('@/components/documents/DocxOnlineEditor'));

export function CitizenSubmissionsView({ onOpenApplication }: { onOpenApplication: (id: string) => Promise<void> }) {
  const user = useAuthStore(s => s.user);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [selected, setSelected] = useState<UserSubmissionDto>();
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState('');
  const query = useCitizenSubmissions(user?.id, true, { page, pageSize: 20, status });
  return <section className="space-y-4 rounded-2xl border bg-white p-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-bold">Bản khai của tôi</h2><p className="mt-1 text-sm text-slate-600">Xem các bản Word đã lưu. Mở hồ sơ liên quan để tiếp tục chỉnh sửa hoặc chốt bản khai.</p></div><Button variant="outline" loading={query.isFetching} onClick={() => void query.refetch()}>Làm mới bản khai</Button></div>
    <label className="grid max-w-sm gap-2 text-sm font-semibold">Trạng thái bản khai<select className="min-h-12 rounded-xl border bg-white px-3" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}><option value="">Tất cả trạng thái</option>{['Draft', 'Submitted', 'RevisionRequested', 'Approved'].map(value => <option key={value} value={value}>{submissionStatusLabel(value)}</option>)}</select></label>
    {error && <p role="alert" className="text-sm text-red-800">{error}</p>}
    {query.isPending ? <p role="status">Đang tải bản khai…</p> : query.isError ? <div role="alert"><p>{documentFormError(query.error)}</p><Button variant="outline" onClick={() => void query.refetch()}>Thử tải lại bản khai</Button></div> : <>
      {!query.data.items.length && <p>Chưa có bản khai phù hợp.</p>}
      {query.data.items.map(item => <article key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4"><div className="min-w-0"><h3 className="break-all font-semibold">{item.fileName}</h3><p className="text-sm text-slate-600">{submissionStatusLabel(item.status)} · {new Date(item.updatedAt || item.createdAt).toLocaleString('vi-VN')}</p>{item.officerComment && <p className="mt-2 whitespace-pre-wrap text-sm">Ghi chú cán bộ: {item.officerComment}</p>}</div><div className="flex flex-wrap gap-2"><Button variant="outline" size="small" onClick={() => setSelected(item)}>Xem bản khai</Button>{item.applicationId ? <Button size="small" disabled={opening} onClick={async () => { setOpening(true); setError(''); try { await onOpenApplication(item.applicationId!); } catch (err) { setError(documentFormError(err)); } finally { setOpening(false); } }}>Mở hồ sơ liên quan</Button> : <p className="text-sm text-amber-800">Bản khai cũ chưa liên kết hồ sơ.</p>}</div></article>)}
      <nav aria-label="Phân trang bản khai" className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm">{query.data.totalCount} bản khai · Trang {page}/{Math.max(1, query.data.totalPages)}</p><div className="flex gap-2"><Button variant="outline" disabled={page <= 1} onClick={() => setPage(x => x - 1)}>Bản khai trước</Button><Button variant="outline" disabled={page >= query.data.totalPages} onClick={() => setPage(x => x + 1)}>Bản khai sau</Button></div></nav>
    </>}
    {selected && user && <Suspense fallback={<Modal open onOpenChange={open => { if (!open) setSelected(undefined); }} title="Xem bản khai"><p role="status">Đang tải trình soạn thảo…</p></Modal>}><DocxOnlineEditor sourceKey={selected.id} title={selected.fileName} author={user.profile?.fullName || user.username} readOnly onClose={() => setSelected(undefined)} load={async signal => { await documentFormApi.getSubmission(selected.id, user.id, signal); return documentFormApi.downloadSubmission(selected.id, user.id, signal); }} /></Suspense>}
  </section>;
}
