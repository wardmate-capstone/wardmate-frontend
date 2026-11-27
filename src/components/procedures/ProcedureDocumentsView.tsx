import type { ReactNode } from 'react';
import { CaretDown, Warning } from '@phosphor-icons/react';
import { checklistQuantityLabel, formatQuantityLines } from '@/lib/procedureDisplay';
import { caseKey, groupByCase, hasCaseSpecificItems, standaloneForms, workflowRows, type CaseRef, type WorkflowRow } from '@/lib/procedureCases';

export type DocumentItem = {
  checklistId: string;
  itemName: string;
  caseCode?: string | null;
  submissionType?: string | null;
  isMandatory?: boolean | null;
  conditionNote?: string | null;
  note?: string | null;
  formCodes?: string[] | null;
  quantity?: number | null;
  quantityText?: string | null;
  documentCopyType?: string | null;
  copyRequirements?: { documentCopyType: string; quantity: number }[] | null;
};
export type DocumentForm = {
  formCode: string;
  formName: string;
  caseCode?: string | null;
  formTemplateId?: string | null;
  isMandatory?: boolean | null;
  quantity?: number | null;
};
type Row = WorkflowRow<DocumentItem, DocumentForm>;

type Props = {
  checklist: readonly DocumentItem[];
  forms: readonly DocumentForm[];
  cases: readonly CaseRef[];
  /** Ô "Mẫu đơn, tờ khai": trang công khai hiện nút Tải mẫu/Xem; bản xem trước chỉ hiện tên. */
  renderForms: (forms: DocumentForm[]) => ReactNode;
  /** Thao tác riêng của từng trường hợp (VD: "Chuẩn bị hồ sơ cho trường hợp này"). */
  caseAction?: (caseCode: string) => ReactNode;
  /** Bản xem trước của Quản lý thủ tục: hiện cả cảnh báo giấy tờ gắn trường hợp không tồn tại. */
  showOrphans?: boolean;
};

/**
 * Thành phần hồ sơ theo WF-CASE-01: giấy tờ xuất trình, giấy tờ nộp chung, rồi từng trường hợp (accordion).
 * Các dòng được tính đúng như Workflow tạo hồ sơ (`workflowRows`): biểu mẫu gắn vào giấy tờ hoặc thành dòng riêng.
 * Thủ tục không có giấy tờ riêng theo trường hợp thì giữ danh sách thông thường. Không hiển thị mục rỗng.
 */
export function ProcedureDocumentsView({ checklist, forms, cases, renderForms, caseAction, showOrphans = false }: Props) {
  const validCases = cases.filter(c => caseKey(c.caseCode));
  const splitByCase = hasCaseSpecificItems(checklist, forms) && validCases.length > 0;
  const orphans = groupByCase(checklist, validCases).orphans;

  if (!checklist.length) {
    return (
      <div className="space-y-3">
        <p className="rounded-md border border-dashed border-slate-300 bg-white p-4 text-center text-xs text-slate-500 sm:text-sm">Thủ tục chưa cập nhật thành phần hồ sơ.</p>
        {showOrphans ? <Standalone checklist={checklist} forms={forms} cases={validCases} /> : <StandaloneDownloads checklist={checklist} forms={forms} cases={validCases} renderForms={renderForms} />}
      </div>
    );
  }

  if (!splitByCase) {
    // 1 trường hợp: BE tự chọn trường hợp đó; 0 hoặc nhiều trường hợp không có giấy tờ riêng: chỉ giấy tờ chung
    const rows = documentRows(workflowRows(checklist, forms, validCases.length === 1 ? validCases[0].caseCode : null));
    const present = rows.filter(isPresent);
    const submit = rows.filter(row => !isPresent(row));
    return (
      <div className="space-y-4">
        {submit.length > 0 && <Group title="* Giấy tờ phải nộp:"><DocumentTable rows={submit} renderForms={renderForms} /></Group>}
        {present.length > 0 && <Group title="* Giấy tờ phải xuất trình:"><DocumentTable rows={present} renderForms={renderForms} /></Group>}
        {validCases.length > 1 && <p className="text-xs text-slate-500">Thủ tục có {validCases.length} trường hợp, giấy tờ giống nhau cho mọi trường hợp.</p>}
        {showOrphans && <Orphans items={orphans} />}
        {showOrphans ? <Standalone checklist={checklist} forms={forms} cases={validCases} /> : <StandaloneDownloads checklist={checklist} forms={forms} cases={validCases} renderForms={renderForms} />}
      </div>
    );
  }

  // Mỗi trường hợp tính riêng như BE; dòng chung = dòng chung có mặt ở mọi trường hợp.
  const perCase = validCases.map(c => ({ caseCode: c.caseCode as string, caseName: c.caseName?.trim() || (c.caseCode as string), rows: documentRows(workflowRows(checklist, forms, c.caseCode)) }));
  const commonKeys = new Set(perCase[0].rows.filter(r => r.common && perCase.every(p => p.rows.some(x => x.key === r.key && x.common))).map(r => r.key));
  const commonRows = perCase[0].rows.filter(r => commonKeys.has(r.key));
  const commonPresent = commonRows.filter(isPresent);
  const commonSubmit = commonRows.filter(row => !isPresent(row));

  return (
    <div className="space-y-5">
      {commonPresent.length > 0 && (
        <Group title="Giấy tờ xuất trình" hint="Mang bản chính khi đến Bộ phận Một cửa để cán bộ đối chiếu.">
          <DocumentTable rows={commonPresent} renderForms={renderForms} />
        </Group>
      )}
      {commonSubmit.length > 0 && (
        <Group title="Giấy tờ nộp chung" hint="Áp dụng cho mọi trường hợp.">
          <DocumentTable rows={commonSubmit} renderForms={renderForms} />
        </Group>
      )}
      <Group title={`Giấy tờ theo trường hợp (${perCase.length})`} hint="Chỉ cần chuẩn bị thêm giấy tờ của trường hợp phù hợp với bạn.">
        <div className="space-y-2">
          {perCase.map((group, index) => {
            const own = group.rows.filter(r => !commonKeys.has(r.key));
            const mandatory = own.filter(r => r.mandatory).length;
            return (
              <details key={group.caseCode} open={perCase.length === 1 || undefined} className="group overflow-hidden rounded-md border border-slate-200 bg-white shadow-2xs">
                <summary className="flex min-h-12 cursor-pointer list-none items-center gap-3 px-3 py-2.5 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-red-800 sm:px-4">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-red-50 text-[11px] font-bold text-red-800">{index + 1}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block break-words text-xs font-semibold text-slate-900 sm:text-sm">{group.caseName}</span>
                    <span className="block text-[11px] text-slate-500">
                      {own.length ? `${own.length} giấy tờ riêng${mandatory ? ` · ${mandatory} bắt buộc` : ''}` : 'Chỉ cần giấy tờ chung'}
                    </span>
                  </span>
                  <CaretDown size={14} className="shrink-0 text-slate-500 transition group-open:rotate-180" aria-hidden />
                </summary>
                <div className="space-y-3 border-t border-slate-100 p-3 sm:p-4">
                  {own.length ? (
                    <DocumentTable rows={own} renderForms={renderForms} showType />
                  ) : (
                    <p className="text-xs text-slate-500">Trường hợp này không có giấy tờ riêng, chỉ cần chuẩn bị giấy tờ chung.</p>
                  )}
                  {caseAction?.(group.caseCode)}
                </div>
              </details>
            );
          })}
        </div>
      </Group>
      {showOrphans && <Orphans items={orphans} />}
      {showOrphans ? <Standalone checklist={checklist} forms={forms} cases={validCases} /> : <StandaloneDownloads checklist={checklist} forms={forms} cases={validCases} renderForms={renderForms} />}
    </div>
  );
}

const isPresent = (row: Row) => row.item?.submissionType === 'XUAT_TRINH';
/**
 * Chỉ hiện giấy tờ. Biểu mẫu không gắn vào giấy tờ nào không được hiện thành một dòng "giấy tờ" riêng: đó là lỗi dữ liệu
 * (thường là các mẫu thay thế của một tờ khai chưa được chọn ở giấy tờ), Quản lý thủ tục thấy cảnh báo để sửa.
 */
const documentRows = (rows: Row[]) => rows.filter(row => row.item);

/**
 * Trang công khai: biểu mẫu chưa gắn giấy tờ không hiện thành dòng giấy tờ, chỉ để tải về tham khảo
 * (giữ đường tải mẫu cho người dân, tránh hiểu nhầm là giấy tờ phải nộp thêm).
 */
function StandaloneDownloads({ checklist, forms, cases, renderForms }: { checklist: readonly DocumentItem[]; forms: readonly DocumentForm[]; cases: readonly CaseRef[]; renderForms: (forms: DocumentForm[]) => ReactNode }) {
  const list = standaloneForms(checklist, forms, cases);
  if (!list.length) return null;
  return (
    <Group title="Biểu mẫu khác để tham khảo" hint="Tải về khi cần; cán bộ sẽ hướng dẫn nếu biểu mẫu áp dụng cho hồ sơ của bạn.">
      <div className="rounded-md border border-slate-200 bg-white p-3 text-xs text-slate-700 shadow-2xs sm:text-sm">{renderForms(list.map(x => x.form))}</div>
    </Group>
  );
}

/** Cảnh báo cho Quản lý thủ tục: biểu mẫu chưa gắn giấy tờ sẽ bị Workflow tách thành mục riêng trong hồ sơ. */
function Standalone({ checklist, forms, cases }: { checklist: readonly DocumentItem[]; forms: readonly DocumentForm[]; cases: readonly CaseRef[] }) {
  const list = standaloneForms(checklist, forms, cases);
  if (!list.length) return null;
  return (
    <div role="alert" className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
      <Warning size={16} className="mt-0.5 shrink-0" aria-hidden />
      <div className="min-w-0 space-y-1">
        <p className="font-semibold">{list.length} biểu mẫu chưa gắn với giấy tờ nào nên không hiển thị ở trên.</p>
        <p>Nếu không sửa, khi tạo hồ sơ hệ thống sẽ tách mỗi biểu mẫu thành một mục riêng. Hãy gắn chúng vào giấy tờ tương ứng ở phần Thành phần hồ sơ.</p>
        <ul className="list-disc pl-4">
          {list.map(x => <li key={x.form.formCode} className="break-words">{x.form.formName || x.form.formCode}{x.caseNames.length > 0 && x.caseNames.length < cases.length ? ` (ở: ${x.caseNames.join('; ')})` : ''}</li>)}
        </ul>
      </div>
    </div>
  );
}

function Orphans({ items }: { items: readonly DocumentItem[] }) {
  if (!items.length) return null;
  return (
    <p role="alert" className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
      <Warning size={16} className="mt-0.5 shrink-0" aria-hidden />
      <span>{items.length} giấy tờ gắn mã trường hợp không tồn tại, công dân sẽ không thấy: {items.map(i => i.itemName || i.checklistId).join('; ')}.</span>
    </p>
  );
}

function Group({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <div>
        <p className="text-xs font-semibold text-slate-800 sm:text-sm">{title}</p>
        {hint && <p className="text-[11px] text-slate-500 sm:text-xs">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

function DocumentTable({ rows, renderForms, showType = false }: { rows: readonly Row[]; renderForms: (forms: DocumentForm[]) => ReactNode; showType?: boolean }) {
  return (
    <div className="overflow-x-auto rounded-md border border-slate-200 bg-white shadow-2xs">
      <table className="w-full table-fixed border-collapse text-left text-xs sm:text-sm [&_td]:align-top [&_td]:[overflow-wrap:anywhere]">
        <thead>
          <tr className="border-b-2 border-[#ca5116] bg-[#eaeff5] font-semibold text-slate-800">
            <th scope="col" className="w-[48%] border-r border-slate-200 p-2.5">Tên giấy tờ</th>
            <th scope="col" className="w-[32%] border-r border-slate-200 p-2.5">Mẫu đơn, tờ khai</th>
            <th scope="col" className="w-[20%] p-2.5 text-center">Số lượng</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {rows.map(row => {
            const item = row.item;
            return (
              <tr key={row.key} className="hover:bg-slate-50/70">
                <td className="border-r border-slate-200 p-2.5">
                  <p className="font-medium text-slate-900">{item ? item.itemName : row.form?.formName || row.form?.formCode}</p>
                  <div className="mt-1 flex flex-wrap gap-1 empty:hidden">
                    {showType && isPresent(row) && <Tag>Xuất trình</Tag>}
                    {!row.mandatory && <Tag>{item ? (item.conditionNote ? 'Có điều kiện' : 'Không bắt buộc') : 'Nộp theo nhu cầu'}</Tag>}
                  </div>
                  {item?.conditionNote && <p className="mt-1 text-xs italic text-slate-500">Ghi chú: {item.conditionNote}</p>}
                  {item?.note && item.note !== item.conditionNote && <p className="mt-1 whitespace-pre-line text-xs text-slate-500">{item.note}</p>}
                </td>
                <td className="border-r border-slate-200 p-2.5 text-slate-600">{renderForms(row.forms)}</td>
                <td className="p-2.5 text-center font-medium text-slate-800">
                  {item
                    ? formatQuantityLines(checklistQuantityLabel(item)).map((line, i) => <span key={i} className="block">{line}</span>)
                    : `${row.quantity} bản`}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const Tag = ({ children }: { children: ReactNode }) => (
  <span className="inline-flex rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-600">{children}</span>
);
