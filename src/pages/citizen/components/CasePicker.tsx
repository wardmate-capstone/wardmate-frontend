import { useId } from 'react';
import { CheckCircle } from '@phosphor-icons/react';
import { dossierPreview, type DossierPreviewItem } from '@/lib/procedureCases';

type Props = {
  cases: { caseCode: string; caseName: string }[];
  value: string;
  onChange: (caseCode: string) => void;
  checklist?: Parameters<typeof dossierPreview>[0] | null;
  forms?: Parameters<typeof dossierPreview>[1] | null;
  disabled?: boolean;
  error?: string;
  /** Trường hợp hồ sơ đang dùng (khi đổi trường hợp): hiển thị nhãn, không cho chọn lại. */
  currentCaseCode?: string;
  label?: string;
};

/**
 * Chọn trường hợp thực hiện thủ tục (WF-CASE-01): mỗi trường hợp một thẻ kèm số giấy tờ riêng;
 * trường hợp đang chọn hiện xem trước "Giấy tờ chung" và "Giấy tờ của trường hợp này".
 */
export function CasePicker({ cases, value, onChange, checklist, forms, disabled, error, currentCaseCode, label = 'Trường hợp của bạn' }: Props) {
  const id = useId();
  const all = checklist ?? [];
  const allForms = forms ?? [];
  const preview = value ? dossierPreview(all, allForms, value) : [];
  const common = preview.filter(item => item.common);
  const specific = preview.filter(item => !item.common);
  const mandatory = preview.filter(item => item.mandatory).length;
  return (
    <div className="min-w-0 space-y-3">
      <fieldset aria-describedby={error ? `${id}-error` : `${id}-hint`} aria-invalid={Boolean(error)} disabled={disabled} className="min-w-0 space-y-2">
        <legend className="text-sm font-semibold text-slate-900">
          {label} <span className="text-red-600" aria-hidden="true">*</span>
        </legend>
        <p id={`${id}-hint`} className="text-xs text-slate-500">Thủ tục có {cases.length} trường hợp. Chọn trường hợp đúng với bạn; hồ sơ chỉ gồm giấy tờ chung và giấy tờ của trường hợp đó.</p>
        <div className="grid gap-2">
          {cases.map((item, index) => {
            const own = dossierPreview(all, allForms, item.caseCode).filter(x => !x.common).length;
            const selected = value === item.caseCode;
            const current = currentCaseCode === item.caseCode;
            return (
              <label
                key={item.caseCode}
                className={`flex min-h-14 min-w-0 cursor-pointer items-start gap-3 rounded-xl border px-3.5 py-3 transition focus-within:ring-4 focus-within:ring-red-100 ${selected ? 'border-red-400 bg-red-50/60' : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'} ${current ? 'cursor-not-allowed opacity-60' : ''}`}
              >
                <input
                  type="radio"
                  name={`${id}-case`}
                  value={item.caseCode}
                  checked={selected}
                  disabled={current}
                  onChange={() => onChange(item.caseCode)}
                  className="mt-0.5 size-4 shrink-0 accent-red-700"
                />
                <span className="min-w-0 flex-1">
                  <span className="block break-words text-sm font-semibold leading-snug text-slate-900">
                    <span className="text-slate-400">{index + 1}. </span>{item.caseName}
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-500">
                    {current ? 'Trường hợp hồ sơ đang dùng' : own ? `Thêm ${own} giấy tờ riêng` : 'Chỉ cần giấy tờ chung'}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
        <p id={`${id}-error`} role="alert" className="text-xs font-medium text-red-700 empty:hidden">{error}</p>
      </fieldset>

      {value && (all.length > 0 || allForms.length > 0) && (
        <section aria-label="Giấy tờ cần chuẩn bị" className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
          <p className="text-xs font-semibold text-slate-800">
            Cần chuẩn bị {preview.length} giấy tờ{mandatory ? `, ${mandatory} bắt buộc` : ''}
          </p>
          {common.length > 0 && <PreviewList title={`Giấy tờ chung (${common.length})`} items={common} />}
          <PreviewList title={`Giấy tờ của trường hợp này (${specific.length})`} items={specific} empty="Không có giấy tờ riêng." />
        </section>
      )}
    </div>
  );
}

function PreviewList({ title, items, empty }: { title: string; items: DossierPreviewItem[]; empty?: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{title}</p>
      {items.length ? (
        <ul className="mt-1 space-y-1">
          {items.map(item => (
            <li key={item.key} className="flex min-w-0 items-start gap-2 text-xs text-slate-700">
              <CheckCircle size={14} className="mt-0.5 shrink-0 text-slate-400" aria-hidden />
              <span className="min-w-0 flex-1 break-words">
                {item.name}
                {(item.present || !item.mandatory) && (
                  <span className="ml-1 text-slate-400">({[item.present && 'xuất trình', !item.mandatory && 'không bắt buộc'].filter(Boolean).join(', ')})</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      ) : <p className="mt-1 text-xs text-slate-500">{empty}</p>}
    </div>
  );
}
