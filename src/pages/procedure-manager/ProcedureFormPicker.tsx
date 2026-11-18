import { useContext, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, X, Sliders, CaretDown, UploadSimple, Books } from '@phosphor-icons/react';
import { Button, Badge, formSelectClass } from '@/components/ui';
import { FormTemplateActions } from '@/components/forms/FormTemplateActions';
import { PROCEDURE_LIMITS, type DocumentFormOption } from '@/lib/api/procedures';
import { ProcedureErrorsContext } from '@/lib/procedureValidation';
import { DirectTemplateUploadModal } from './DirectTemplateUploadModal';
import { FormLibraryModal } from './FormLibraryModal';

type Row = Record<string, unknown>;
export function ProcedureFormPicker({
  value,
  change,
  disabled,
  onEdit,
  cases = [],
  removedForms,
  onTemplateCreated,
}: {
  value: unknown;
  change: (value: Row[]) => void;
  disabled: boolean;
  onEdit?: () => void;
  cases?: { code: string; name: string }[];
  removedForms: Record<string, Row>;
  onTemplateCreated?: (newTemplate: { id: string; code: string; title: string }, updatedList: Row[]) => void | Promise<void>;
}) {
  const list: Row[] = Array.isArray(value) ? value.map(row => row && typeof row === 'object' && !Array.isArray(row) ? row : {}) : [];
  const queryClient = useQueryClient();
  // Kho biểu mẫu mở trong hộp thoại riêng để kho nhiều mẫu không làm dài bước này
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [uploadModalData, setUploadModalData] = useState<{
    open: boolean;
    rowIndex: number | null;
    initialCode: string;
    initialName: string;
  }>({
    open: false,
    rowIndex: null,
    initialCode: '',
    initialName: '',
  });

  const errors = useContext(ProcedureErrorsContext);
  const isAttached = (form: DocumentFormOption) => list.some(row => row.formTemplateId === form.id || row.formCode === form.formCode);
  const addForms = (forms: DocumentFormOption[]) => {
    const fresh = forms.filter(form => !isAttached(form));
    if (!fresh.length) return;
    change([...list, ...fresh.map(form => removedForms[form.id] ?? {
      formTemplateId: form.id,
      formCode: form.formCode,
      formName: form.formName,
      formType: form.formType || 'DOCX_TEMPLATE',
      caseCode: null,
      quantity: 1,
      isMandatory: true,
    })]);
  };
  const remove = (index: number) => {
    const row = list[index];
    if (typeof row.formTemplateId === 'string') removedForms[row.formTemplateId] = { ...row };
    change(list.filter((_, i) => i !== index));
  };
  const update = (index: number, patch: Row) => change(list.map((row, i) => i === index ? { ...row, ...patch } : row));
  // AI-02b: mã trường hợp dạng TH-2, TH-3… không có nghĩa với người đọc, nên hiển thị tên trường hợp
  const caseLabel = (code: unknown) => {
    const found = cases.find(item => item.code === code);
    return found?.name || `Trường hợp ${String(code)}`;
  };

  const handleTemplateSuccess = async (created: { id: string; code: string; title: string }) => {
    let nextList: Row[];
    if (uploadModalData.rowIndex !== null) {
      // Giữ nguyên formCode của dòng: giấy tờ ở "Thành phần hồ sơ" liên kết bằng mã này (so khớp phân biệt hoa thường).
      // Mã phôi trong kho bị viết hoa (vd "Mẫu số 3" → "MẪU SỐ 3"); ghi đè sẽ làm giấy tờ mất liên kết với biểu mẫu.
      nextList = list.map((r, i) => i === uploadModalData.rowIndex ? {
        ...r,
        formTemplateId: created.id,
        formCode: typeof r.formCode === 'string' && r.formCode.trim() ? r.formCode : created.code,
        formName: created.title,
        formType: 'DOCX_TEMPLATE',
      } : r);
    } else {
      nextList = [...list, {
        formTemplateId: created.id,
        formCode: created.code,
        formName: created.title,
        formType: 'DOCX_TEMPLATE',
        quantity: 1,
        isMandatory: true,
        caseCode: null,
      }];
    }
    change(nextList);
    if (onTemplateCreated) {
      await onTemplateCreated(created, nextList);
    }
    // Kho vừa có phôi mới: tải lại khi mở hộp thoại kho lần sau
    await queryClient.invalidateQueries({ queryKey: ['procedure-document-forms'] });
  };

  const selectedForms = <section aria-label="Biểu mẫu đã gắn" className="min-w-0">
    {list.length === 0 ? <p className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-sm leading-6 text-slate-600">Thủ tục chưa được gắn biểu mẫu.{!disabled && ' Bấm “Chọn từ kho” hoặc “Tạo phôi mới” để thêm.'}</p> : <div className="grid items-start gap-3 xl:grid-cols-2">
      {list.map((row, index) => (
        <article key={String(row.formTemplateId ?? row.formCode) + index} className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span data-field={`formDefinitions.${index}.formCode`} tabIndex={-1} className="font-mono text-xs font-bold text-red-900 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                  {String(row.formCode)}
                </span>
                {!row.formTemplateId && (
                  <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                    Chưa gắn phôi Word
                  </span>
                )}
                {row.isMandatory === false && (
                  <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                    Không bắt buộc
                  </span>
                )}
              </div>
              <p data-field={`formDefinitions.${index}.formName`} tabIndex={-1} className="mt-1.5 font-bold text-sm text-slate-900 leading-snug">
                {String(row.formName ?? '').trim() || <span className="font-medium italic text-red-700">Chưa có tên biểu mẫu</span>}
              </p>
            </div>
            {!disabled && (
              <Button size="small" variant="ghost" className="shrink-0 text-slate-400 hover:text-red-700 hover:bg-red-50" aria-label={`Bỏ mẫu ${String(row.formName)}`} onClick={() => remove(index)}>
                <X size={16} aria-hidden />
              </Button>
            )}
          </div>

          {(errors[`formDefinitions.${index}.formCode`] || errors[`formDefinitions.${index}.formName`]) && (
            <p className="text-xs font-medium text-red-700 bg-red-50 p-2 rounded-lg border border-red-200">
              Mã hoặc tên biểu mẫu không hợp lệ. Hãy kiểm tra lại thông tin.
            </p>
          )}

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 bg-slate-50/80 px-3 py-2 rounded-lg border border-slate-100">
            <span>Số lượng: <strong>{row.quantity == null ? '1 bản' : `${String(row.quantity)} bản`}</strong></span>
            <span className="text-slate-300">•</span>
            <span>Loại: <strong>{row.formType === 'ONLINE_INTERACTIVE' ? 'Mẫu điện tử tương tác' : 'Mẫu Word (DOCX)'}</strong></span>
            <span className="text-slate-300">•</span>
            <span className="min-w-0 break-words">Áp dụng: <strong>{row.caseCode ? caseLabel(row.caseCode) : 'Mọi trường hợp'}</strong></span>
          </div>

          <div className="pt-1 flex flex-wrap items-center gap-2">
            <FormTemplateActions templateId={typeof row.formTemplateId === 'string' ? row.formTemplateId : null} name={String(row.formName)} />
            {!row.formTemplateId && !disabled && (
              <Button
                size="small"
                variant="outline"
                className="gap-1.5 text-xs text-amber-900 border-amber-300 bg-amber-50/70 hover:bg-amber-100 hover:border-amber-400"
                onClick={() => setUploadModalData({
                  open: true,
                  rowIndex: index,
                  initialCode: String(row.formCode ?? ''),
                  initialName: String(row.formName ?? ''),
                })}
              >
                <UploadSimple size={14} className="text-amber-800" />
                Tạo phôi & tải DOCX
              </Button>
            )}
          </div>

          {!disabled && (
            <details className="group rounded-xl border border-slate-200/80 bg-slate-50/60 p-3 transition-colors open:bg-slate-50 open:border-slate-300">
              <summary className="flex items-center justify-between cursor-pointer list-none text-xs font-bold text-slate-700 hover:text-red-900 transition-colors select-none">
                <span className="flex items-center gap-1.5">
                  <Sliders size={14} className="text-red-800 shrink-0" />
                  <span>Thiết lập sử dụng mẫu</span>
                </span>
                <CaretDown size={14} className="transition-transform group-open:rotate-180 text-slate-400 shrink-0" />
              </summary>
              <div className="mt-3 pt-3 border-t border-slate-200/70 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* BE lưu nguyên formName khi lưu bản nháp/thủ tục (bắt buộc khác rỗng); AI có thể đặt tên chưa chuẩn nên cho sửa */}
                <div className="sm:col-span-2">
                  <label htmlFor={`form-name-${index}`} className="block text-xs font-semibold text-slate-700 mb-1">Tên biểu mẫu hiển thị</label>
                  <input
                    id={`form-name-${index}`}
                    type="text"
                    value={String(row.formName ?? '')}
                    maxLength={PROCEDURE_LIMITS.singleLine}
                    placeholder="Ví dụ: Tờ khai đăng ký khai sinh"
                    aria-invalid={!String(row.formName ?? '').trim() || Boolean(errors[`formDefinitions.${index}.formName`])}
                    className="w-full h-9 px-3 text-xs bg-white border border-slate-300 rounded-lg font-medium aria-[invalid=true]:border-red-500 focus:border-red-600 focus:outline-none focus:ring-4 focus:ring-red-100"
                    onChange={event => update(index, { formName: event.target.value })}
                  />
                  {!String(row.formName ?? '').trim()
                    ? <p className="mt-1 text-[11px] text-red-600 font-medium">Tên biểu mẫu không được để trống.</p>
                    : <p className="mt-1 text-[11px] text-slate-500">Tên công dân thấy ở danh sách biểu mẫu của thủ tục. Không đổi tên tệp phôi Word trong kho.</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Số lượng bản nộp</label>
                  <input
                    data-field={`formDefinitions.${index}.quantity`}
                    type="number"
                    min={1}
                    step={1}
                    value={String(row.quantity ?? '')}
                    placeholder="1"
                    className="w-full h-9 px-3 text-xs bg-white border border-slate-300 rounded-lg font-medium focus:border-red-600 focus:outline-none focus:ring-4 focus:ring-red-100"
                    onChange={event => update(index, { quantity: event.target.value === '' ? null : Number(event.target.value) })}
                  />
                  {errors[`formDefinitions.${index}.quantity`] && (
                    <p className="mt-1 text-[11px] text-red-600 font-medium">{errors[`formDefinitions.${index}.quantity`]}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Quy định nộp</label>
                  <select
                    aria-label="Yêu cầu"
                    className={formSelectClass}
                    value={row.isMandatory === false ? 'optional' : 'required'}
                    onChange={event => update(index, { isMandatory: event.target.value === 'required' })}
                  >
                    <option value="required">Bắt buộc</option>
                    <option value="optional">Không bắt buộc (nếu có)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Loại biểu mẫu</label>
                  <select
                    aria-label="Loại biểu mẫu"
                    data-field={`formDefinitions.${index}.formType`}
                    className={formSelectClass}
                    value={row.formType === 'ONLINE_INTERACTIVE' ? 'ONLINE_INTERACTIVE' : 'DOCX_TEMPLATE'}
                    onChange={event => update(index, { formType: event.target.value as 'DOCX_TEMPLATE' | 'ONLINE_INTERACTIVE' })}
                  >
                    <option value="DOCX_TEMPLATE">Mẫu Word (phôi DOCX)</option>
                    <option value="ONLINE_INTERACTIVE">Mẫu điện tử tương tác</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Trường hợp áp dụng</label>
                  <select
                    aria-label="Trường hợp áp dụng"
                    data-field={`formDefinitions.${index}.caseCode`}
                    className={`${formSelectClass} truncate`}
                    value={String(row.caseCode ?? '')}
                    onChange={event => update(index, { caseCode: event.target.value || null })}
                  >
                    <option value="">Mọi trường hợp</option>
                    {cases.filter(item => item.code).map((item, i) => (
                      <option key={item.code + i} value={item.code} title={item.name || item.code}>
                        {item.name || item.code}
                      </option>
                    ))}
                  </select>
                  {Boolean(row.caseCode) && !cases.some(item => item.code === row.caseCode) && (
                    <p className="mt-1 text-[11px] text-red-600 font-medium">Vui lòng chọn lại trường hợp áp dụng.</p>
                  )}
                </div>
              </div>
            </details>
          )}
        </article>
      ))}
    </div>}
  </section>;

  return <section className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h3 className="flex items-center gap-2 font-bold">Biểu mẫu <Badge variant="info" className="px-2 py-0.5 text-xs">{list.length}</Badge></h3>
      {disabled
        ? onEdit && <Button size="small" variant="outline" onClick={onEdit}>{list.length ? 'Quản lý biểu mẫu' : 'Chọn biểu mẫu'}</Button>
        : <div className="flex flex-wrap items-center gap-2">
          <Button size="small" variant="outline" className="gap-1.5" onClick={() => setLibraryOpen(true)}>
            <Books size={16} aria-hidden="true" />
            Chọn từ kho
          </Button>
          <Button
            size="small"
            variant="outline"
            className="gap-1.5"
            onClick={() => setUploadModalData({ open: true, rowIndex: null, initialCode: '', initialName: '' })}
          >
            <Plus size={14} weight="bold" aria-hidden="true" />
            Tạo phôi mới
          </Button>
        </div>}
    </div>
    {selectedForms}

    {!disabled && <FormLibraryModal open={libraryOpen} onOpenChange={setLibraryOpen} isAttached={isAttached} onAdd={addForms} />}
    <DirectTemplateUploadModal
      open={uploadModalData.open}
      onOpenChange={(open) => setUploadModalData(prev => ({ ...prev, open }))}
      initialCode={uploadModalData.initialCode}
      initialName={uploadModalData.initialName}
      onSuccess={handleTemplateSuccess}
    />
  </section>;
}
