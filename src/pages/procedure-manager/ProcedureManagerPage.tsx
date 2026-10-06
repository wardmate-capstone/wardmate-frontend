import { useCallback, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ProcedureManagerSidebar, type ProcedureNavSection } from './ProcedureManagerSidebar';
import { ProcedureManagerHeader, sectionTitles } from './ProcedureManagerHeader';
import { ProcedureProfileView } from './ProcedureProfileView';
import { Button, Modal } from '@/components/ui';
import { ProcedureFeedback } from '@/components/ui/ProcedureFeedback';
import { useProcedureQuery } from '@/hooks/useProcedureQuery';
import { procedureApi, procedureError, type ProcedureSummary } from '@/lib/api/procedures';
import { ProcedureDashboardView } from './ProcedureDashboardView';
import { ProcedureApiList } from './ProcedureApiList';
import { ProcedureApiDetail } from './ProcedureApiDetail';
import { ProcedureApiEditor, emptyProcedure, validateProcedure } from './ProcedureApiEditor';
import { ProcedureDraftWorkspace } from './ProcedureDraftWorkspace';
import { toast } from '@/components/ui/Toast';

export function ProcedureManagerPage() {
  const [params, setParams] = useSearchParams();
  const [section, setSection] = useState<ProcedureNavSection>('dashboard');
  const [mobile, setMobile] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [selected, setSelected] = useState<ProcedureSummary>();
  const [revision, setRevision] = useState(0);
  const [creating, setCreating] = useState(false);
  const [input, setInput] = useState<Record<string, unknown>>(emptyProcedure);
  const [mode, setMode] = useState<'create' | 'publish'>('create');
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [draftPending, setDraftPending] = useState(false);
  const lock = useRef(false);
  const categories = useProcedureQuery(useCallback((signal: AbortSignal) => procedureApi.categories(signal), []));
  const stats = useProcedureQuery(useCallback(async (signal: AbortSignal) => {
    void revision;
    const [active, inactive] = await Promise.all([procedureApi.list({ isActive: true, pageSize: 1 }, true, signal), procedureApi.list({ isActive: false, pageSize: 1 }, true, signal)]);
    return { active: active.totalCount, inactive: inactive.totalCount };
  }, [revision]));
  const drafts = params.get('section') === 'drafts' || params.has('draft');
  const navigate = (next: ProcedureNavSection) => { if (draftPending) { toast.info('Hãy lưu hoặc bỏ thay đổi và chờ thao tác hoàn tất trước khi rời bản nháp.'); return; } setSection(next); setSelected(undefined); setParams({}); };
  const openCreate = () => { setInput(emptyProcedure()); setMode('create'); setConfirmed(false); setError(''); setCreating(true); };
  const procedureSections = ['procedures', 'checklists', 'steps', 'attach-forms', 'procedure-legal-links'];
  return <div className="admin-layout procedure-manager-layout"><a href="#procedure-manager-main" className="skip-link">Đến nội dung chính</a><ProcedureManagerSidebar currentSection={section} onSelectSection={navigate} isOpenMobile={mobile} onCloseMobile={() => setMobile(false)} isCollapsedDesktop={collapsed} onToggleCollapseDesktop={() => setCollapsed(!collapsed)} publishedCount={stats.data?.active} /><div className={`admin-workspace ${collapsed ? 'is-sidebar-collapsed' : ''}`}><ProcedureManagerHeader onOpenMobileSidebar={() => setMobile(true)} isCollapsedDesktop={collapsed} onToggleCollapseDesktop={() => setCollapsed(!collapsed)} /><main id="procedure-manager-main" className="admin-main space-y-5" tabIndex={-1}>
    {!drafts && !selected && section !== 'profile' && <div className="flex flex-wrap items-center justify-between gap-4"><h1 className="text-2xl font-bold">{sectionTitles[section].title}</h1><div className="flex flex-wrap gap-3"><Button variant="outline" onClick={() => { setSelected(undefined); setParams({ section: 'drafts' }); }}>PDF và bản nháp</Button><Button onClick={openCreate}>Thêm thủ tục</Button></div></div>}
    <ProcedureFeedback loading={categories.loading} error={categories.error} retry={categories.refresh} />
    {drafts ? <ProcedureDraftWorkspace onPendingChange={setDraftPending} categories={categories.data ?? []} onPublished={() => setRevision(v => v + 1)} /> : selected ? <ProcedureApiDetail key={selected.id} row={selected} categories={categories.data ?? []} onBack={() => setSelected(undefined)} onChange={active => { setSelected(value => value ? { ...value, isActive: active } : undefined); setRevision(v => v + 1); }} /> : section === 'profile' ? <ProcedureProfileView /> : section === 'categories' ? <div className="admin-card space-y-4 p-5"><p className="text-sm text-slate-600">Danh mục từ máy chủ. Backend chưa cung cấp thao tác thêm, sửa hoặc xóa danh mục.</p>{categories.data?.map(c => <div key={c.id} className="border-b py-3"><h2 className="font-bold">{c.categoryName}</h2><p>{c.description || 'Chưa có mô tả.'}</p></div>)}</div> : section === 'dashboard' ? <><ProcedureFeedback loading={stats.loading} error={stats.error} retry={stats.refresh} /><ProcedureDashboardView key={revision} stats={stats.data} onNavigateSection={navigate} onSelectProcedure={setSelected} onOpenDrafts={() => setParams({ section: 'drafts' })} /></> : procedureSections.includes(section) ? <><p className="text-sm text-slate-600">Chọn thủ tục để xem hoặc chỉnh sửa thông tin, giấy tờ, quy trình, biểu mẫu liên kết và căn cứ pháp lý.</p><ProcedureApiList categories={categories.data ?? []} onSelect={setSelected} revision={revision} /></> : <section className="admin-card space-y-3 p-6"><h2 className="text-lg font-bold">Chưa có kết nối cho chức năng này</h2><p>{['forms', 'upload-form', 'form-versions'].includes(section) ? 'Kho biểu mẫu và file DOCX thuộc dịch vụ DocumentForm, không phải API Procedure Catalog. Dữ liệu minh họa đã được bỏ khỏi màn hình.' : section === 'audit-logs' ? 'Catalog cung cấp lịch sử phiên bản theo từng thủ tục, chưa có API nhật ký tổng hợp.' : section === 'legal-docs' ? 'Căn cứ pháp lý được lưu trong từng thủ tục; chưa có API kho văn bản pháp lý độc lập.' : 'Chưa có API quản lý kho tri thức hoặc đồng bộ AI.'}</p><Button variant="outline" onClick={() => navigate('procedures')}>Mở danh sách thủ tục</Button></section>}
    <Modal open={creating} onOpenChange={open => { if (!busy) setCreating(open); }} title="Thêm thủ tục" description="Thủ tục sẽ được công khai khi lưu thành công. Muốn lưu nháp, dùng luồng PDF và bản nháp." className="sm:max-w-5xl" footer={<Button loading={busy} disabled={!confirmed} onClick={async () => {
      if (lock.current) return;
      lock.current = true; setBusy(true); setError('');
      try { const data = validateProcedure(input); const created = mode === 'create' ? await procedureApi.create(data) : await procedureApi.publish(data); setCreating(false); setRevision(v => v + 1); setSelected(created); toast.success('Đã lưu thủ tục trên máy chủ.'); }
      catch (e) { setError(procedureError(e)); } finally { setBusy(false); lock.current = false; }
    }}>Xác nhận lưu</Button>}><ProcedureFeedback error={error} /><ProcedureApiEditor value={input} onChange={next => { setInput(next); setConfirmed(false); }} categories={categories.data ?? []} disabled={busy} /><label className="my-4 grid gap-2 text-sm font-semibold">Cách lưu<select aria-label="Cách lưu" className="min-h-11 rounded-lg border p-3" disabled={busy} value={mode} onChange={e => { setMode(e.target.value as 'create' | 'publish'); setConfirmed(false); }}><option value="create">Tạo mới — từ chối mã đã tồn tại</option><option value="publish">Xuất bản nội dung đã đối soát — cập nhật nếu mã tồn tại</option></select></label>{mode === 'publish' && <p className="my-3 text-sm text-amber-900">Nếu mã đã tồn tại, toàn bộ nội dung sẽ được thay thế và lưu phiên bản cũ. Nếu mất kết nối, kiểm tra thủ tục và lịch sử trước khi gửi lại.</p>}<label className="flex gap-3 text-sm"><input type="checkbox" disabled={busy} checked={confirmed} onChange={e => setConfirmed(e.target.checked)} />Tôi đã đối soát thông tin và xác nhận lưu nội dung này.</label></Modal>
  </main></div></div>;
}
