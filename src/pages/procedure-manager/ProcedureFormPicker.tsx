import { useContext, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, Plus, X } from '@phosphor-icons/react';
import { Button, Input, Badge, ListSkeleton } from '@/components/ui';
import { FormTemplateActions } from '@/components/forms/FormTemplateActions';
import { formTemplateErrorMessage, getFormTemplates, type FormTemplateDto } from '@/lib/api/formTemplates';
import { useAuthStore } from '@/stores/authStore';
import { ProcedureErrorsContext } from '@/lib/procedureValidation';

type Row = Record<string, unknown>;
export function ProcedureFormPicker({ value, change, disabled, onEdit, cases = [], removedForms }: {
  value: unknown;
  change: (value: Row[]) => void;
  disabled: boolean;
  onEdit?: () => void;
  cases?: { code: string; name: string }[];
  removedForms: Record<string, Row>;
}) {
  const list: Row[] = Array.isArray(value) ? value.map(row => row && typeof row === 'object' && !Array.isArray(row) ? row : {}) : [];
  const user = useAuthStore(state => state.user);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const errors = useContext(ProcedureErrorsContext);
  const query = useQuery({
    queryKey: ['form-templates', user?.id, 'picker', search.trim(), page],
    queryFn: async ({ signal }) => {
      if (search.trim()) await new Promise<void>((resolve, reject) => {
        const timer = window.setTimeout(resolve, 300);
        signal.addEventListener('abort', () => {
          window.clearTimeout(timer);
          reject(new DOMException('Aborted', 'AbortError'));
        }, { once: true });
      });
      return getFormTemplates({ page, pageSize: 10, isActive: true, searchCode: search.trim() }, signal);
    },
    enabled: Boolean(user && !disabled),
  });
  const toggle = (template: FormTemplateDto) => {
    const selected = list.some(row => row.formTemplateId === template.id);
    if (selected || !template.isActive || !template.fileDocxUrl) return;
    change([...list, removedForms[template.id] ?? {
      formTemplateId: template.id, formCode: template.code, formName: template.title,
      formType: 'DOCX_TEMPLATE', caseCode: null, quantity: 1, isMandatory: true,
    }]);
  };
  const remove = (index: number) => {
    const row = list[index];
    if (typeof row.formTemplateId === 'string') removedForms[row.formTemplateId] = { ...row };
    change(list.filter((_, i) => i !== index));
  };
  const update = (index: number, patch: Row) => change(list.map((row, i) => i === index ? { ...row, ...patch } : row));

  const selectedForms = <section aria-label="Biểu mẫu đã gắn" className="min-w-0 rounded-xl border border-red-100 bg-red-50/30 p-4">
    <div className="mb-3 flex items-center justify-between gap-2">
      <h4 className="font-bold">Đã chọn cho thủ tục</h4><Badge variant="info">{list.length} mẫu</Badge>
    </div>
    {list.length === 0 ? <p className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-sm leading-6 text-slate-600">Thủ tục chưa được gắn biểu mẫu.{!disabled && ' Bấm “Chọn mẫu” trong kho bên cạnh để thêm.'}</p> : <div className="space-y-3">
      {list.map((row, index) => <article key={String(row.formTemplateId ?? row.formCode) + index} className="rounded-lg border border-slate-200 bg-white p-3">
        <div className="mb-2 flex items-start justify-between gap-2">
          <div className="min-w-0"><span data-field={`formDefinitions.${index}.formCode`} tabIndex={-1} className="text-xs font-bold text-red-800">{String(row.formCode)}</span><p data-field={`formDefinitions.${index}.formName`} tabIndex={-1} className="mt-1 font-semibold leading-5">{String(row.formName)}</p></div>
          {!disabled && <Button size="small" variant="ghost" className="shrink-0 px-2" aria-label={`Bỏ mẫu ${String(row.formName)}`} onClick={() => remove(index)}><X size={16} aria-hidden /></Button>}
        </div>
        {(errors[`formDefinitions.${index}.formCode`] || errors[`formDefinitions.${index}.formName`]) && <p className="mb-2 text-xs text-red-800">Mã hoặc tên biểu mẫu không hợp lệ. Hãy bỏ mẫu và chọn lại từ kho.</p>}
        <p className="mb-2 text-xs text-slate-600">{row.quantity == null ? 'Chưa nhập số bản' : `${String(row.quantity)} bản`} · {row.isMandatory === false ? 'Không bắt buộc' : 'Bắt buộc'}{row.caseCode ? ` · Trường hợp ${String(row.caseCode)}` : ' · Mọi trường hợp'}</p>
        <FormTemplateActions templateId={typeof row.formTemplateId === 'string' ? row.formTemplateId : null} name={String(row.formName)} />
        {!disabled && <details className="mt-3 border-t border-slate-100 pt-2">
          <summary className="min-h-8 cursor-pointer text-xs font-semibold text-slate-700">Thiết lập sử dụng mẫu</summary>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Input data-field={`formDefinitions.${index}.quantity`} label="Số lượng" type="number" min={1} step={1} value={String(row.quantity ?? '')} error={errors[`formDefinitions.${index}.quantity`] || (!Number.isInteger(row.quantity) || Number(row.quantity) < 1 ? 'Nhập số nguyên lớn hơn hoặc bằng 1.' : undefined)} onChange={event => update(index, { quantity: event.target.value === '' ? null : Number(event.target.value) })} />
            <label className="grid gap-2 text-sm font-semibold">Yêu cầu<select aria-label="Yêu cầu" className="min-h-12 rounded-xl border border-slate-300 bg-white px-3" value={row.isMandatory === false ? 'optional' : 'required'} onChange={event => update(index, { isMandatory: event.target.value === 'required' })}><option value="required">Bắt buộc</option><option value="optional">Không bắt buộc</option></select></label>
            <label data-field={`formDefinitions.${index}.caseCode`} className="grid gap-2 text-sm font-semibold">Trường hợp áp dụng
              <select aria-label="Trường hợp áp dụng" className="min-h-12 rounded-xl border border-slate-300 bg-white px-3" aria-invalid={Boolean(row.caseCode && !cases.some(item => item.code === row.caseCode))} aria-describedby={Boolean(row.caseCode) && !cases.some(item => item.code === row.caseCode) ? `form-case-${index}-error` : undefined} value={String(row.caseCode ?? '')} onChange={event => update(index, { caseCode: event.target.value || null })}>
                <option value="">Mọi trường hợp</option>
                {Boolean(row.caseCode) && !cases.some(item => item.code === row.caseCode) && <option value={String(row.caseCode)} disabled>Trường hợp không còn tồn tại: {String(row.caseCode)}</option>}
                {cases.filter(item => item.code).map((item, i) => <option key={item.code + i} value={item.code}>{item.code}{item.name ? ` · ${item.name}` : ''}</option>)}
              </select>
              {Boolean(row.caseCode) && !cases.some(item => item.code === row.caseCode) && <span id={`form-case-${index}-error`} className="text-xs text-red-800">Vui lòng chọn lại trường hợp áp dụng.</span>}
            </label>
            <p className="text-sm text-slate-600">Loại biểu mẫu: {row.formType === 'DOCX_TEMPLATE' ? 'Mẫu Word (DOCX)' : row.formType === 'ONLINE_INTERACTIVE' ? 'Mẫu điện tử tương tác (cấu hình hiện có)' : 'Cần kiểm tra loại biểu mẫu'}</p>
          </div>
        </details>}
      </article>)}
    </div>}
  </section>;

  return <section className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h3 className="font-bold">Biểu mẫu <span className="text-sm font-normal text-slate-500">({list.length} đã gắn)</span></h3>
      {disabled && onEdit && <Button size="small" variant="outline" onClick={onEdit}>{list.length ? 'Quản lý biểu mẫu' : 'Chọn biểu mẫu'}</Button>}
    </div>
    {!disabled && <p className="text-sm text-slate-600">Chọn nhiều mẫu trong kho. Mẫu đã chọn sẽ được cung cấp cho công dân sau khi lưu thủ tục.</p>}
    <div className={disabled ? '' : 'grid items-start gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]'}>
      {!disabled && <section aria-label="Kho biểu mẫu" className="min-w-0 rounded-xl border border-slate-200 bg-white">
        <div className="space-y-3 border-b border-slate-200 p-4">
          <h4 className="font-bold">Chọn từ kho biểu mẫu</h4>
          <Input label="Tìm biểu mẫu theo mã" placeholder="Nhập mã đơn, ví dụ: DON_01" value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} />
          <p className="text-xs text-slate-500">Để trống để duyệt kho. Mẫu chưa có tệp Word chưa thể chọn.</p>
        </div>
        {query.isPending ? <div className="p-4"><ListSkeleton rows={3} /></div> : query.isError ? <div role="alert" className="space-y-3 p-4 text-sm text-red-800"><p>{formTemplateErrorMessage(query.error)}</p><Button size="small" variant="outline" onClick={() => void query.refetch()}>Thử lại</Button></div> : <>
          <div className="divide-y divide-slate-100">
            {query.data.items.length === 0 && <p className="p-4 text-sm text-slate-500">Không tìm thấy mẫu phù hợp. Hãy thử mã khác.</p>}
            {query.data.items.map(template => {
              const selected = list.some(row => row.formTemplateId === template.id);
              return <article key={template.id} className={`space-y-2 p-3 ${selected ? 'bg-red-50/50' : ''}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0"><span className="text-xs font-bold text-slate-500">{template.code}</span><p className="mt-1 text-sm font-semibold leading-5">{template.title}</p></div>
                  <Button size="small" variant={selected ? 'primary' : 'outline'} className="shrink-0 px-3" disabled={selected || !template.fileDocxUrl || !template.isActive} aria-label={`${template.code} · ${template.title}`} aria-pressed={selected} onClick={() => toggle(template)}>{selected ? <Check size={16} aria-hidden /> : <Plus size={16} aria-hidden />}{selected ? 'Đã chọn' : 'Chọn mẫu'}</Button>
                </div>
                {template.fileDocxUrl ? <FormTemplateActions templateId={template.id} name={template.title} hasFile /> : <p className="text-xs text-amber-800">Chưa có tệp Word</p>}
              </article>;
            })}
          </div>
          <nav aria-label="Phân trang kho biểu mẫu" className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 p-3">
            <span className="text-xs text-slate-600">{query.data.totalCount} mẫu · Trang {page}/{query.data.totalPages || 1}</span>
            <div className="flex gap-1"><Button size="small" variant="ghost" disabled={page <= 1} onClick={() => setPage(value => value - 1)}>Trước</Button><Button size="small" variant="ghost" disabled={page >= query.data.totalPages} onClick={() => setPage(value => value + 1)}>Sau</Button></div>
          </nav>
        </>}
      </section>}
      {selectedForms}
    </div>
  </section>;
}
