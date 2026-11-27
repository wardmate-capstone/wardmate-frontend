/**
 * WF-CASE-01: thủ tục nhiều trường hợp.
 * - Giấy tờ `caseCode` rỗng/null là giấy tờ chung, mọi trường hợp đều áp dụng.
 * - Giấy tờ có `caseCode` chỉ thuộc trường hợp đó.
 * - Hồ sơ đã tạo là snapshot: hiển thị theo `checklists[]` của hồ sơ, không theo thủ tục hiện tại.
 */

export type CaseRef = { caseCode?: string | null; caseName?: string | null };
type HasCase = { caseCode?: string | null };

/** Mã trường hợp đã chuẩn hóa: chuỗi rỗng/khoảng trắng coi như giấy tờ chung (null). */
export const caseKey = (value?: string | null) => (value && value.trim() ? value : null);

/** Giấy tờ áp dụng cho một trường hợp: giấy tờ chung + giấy tờ của đúng trường hợp đó (mã phân biệt hoa/thường như BE). */
export function applicableItems<T extends HasCase>(items: readonly T[], caseCode?: string | null): T[] {
  const selected = caseKey(caseCode);
  return items.filter(item => {
    const own = caseKey(item.caseCode);
    return own === null || own === selected;
  });
}

export type CaseGroups<T> = {
  common: T[];
  cases: { caseCode: string; caseName: string; items: T[] }[];
  /** Giấy tờ gắn mã trường hợp không còn trong danh sách trường hợp (dữ liệu lỗi, BE sẽ từ chối khi lưu). */
  orphans: T[];
};

/** Chia giấy tờ thành nhóm chung và từng trường hợp, giữ nguyên thứ tự gốc trong mỗi nhóm. */
export function groupByCase<T extends HasCase>(items: readonly T[], cases: readonly CaseRef[]): CaseGroups<T> {
  const groups = cases
    .filter(c => caseKey(c.caseCode))
    .map(c => ({ caseCode: c.caseCode as string, caseName: c.caseName?.trim() || (c.caseCode as string), items: [] as T[] }));
  const byCode = new Map(groups.map(g => [g.caseCode, g]));
  const common: T[] = [];
  const orphans: T[] = [];
  for (const item of items) {
    const code = caseKey(item.caseCode);
    if (code === null) common.push(item);
    else (byCode.get(code)?.items ?? orphans).push(item);
  }
  return { common, cases: groups, orphans };
}

/** Thủ tục có trường hợp thật sự khác nhau về giấy tờ (có ít nhất một giấy tờ/biểu mẫu gắn trường hợp). */
export function hasCaseSpecificItems(...lists: readonly (readonly HasCase[] | null | undefined)[]) {
  return lists.some(list => (list ?? []).some(item => caseKey(item.caseCode) !== null));
}

/** Người dân phải tự chọn trường hợp khi thủ tục có từ 2 trường hợp (BE tự chọn khi chỉ có 1). */
export const requiresCaseChoice = (cases: readonly CaseRef[] | null | undefined) => (cases?.length ?? 0) > 1;

/** Tên trường hợp để hiển thị; không tìm thấy (thủ tục đã đổi) thì trả lại mã. */
export function caseDisplayName(caseCode: string | null | undefined, cases: readonly CaseRef[] | null | undefined) {
  const code = caseKey(caseCode);
  if (!code) return null;
  return cases?.find(c => c.caseCode === code)?.caseName?.trim() || code;
}

/** Mã gợi ý cho trường hợp mới theo quy ước AI bóc tách: TH-1, TH-2… không trùng mã đã có. */
export function nextCaseCode(cases: readonly CaseRef[]) {
  const used = new Set(cases.map(c => c.caseCode ?? ''));
  let n = cases.length + 1;
  while (used.has(`TH-${n}`)) n += 1;
  return `TH-${n}`;
}

type PreviewChecklist = HasCase & { checklistId: string; itemName: string; isMandatory?: boolean | null; submissionType?: string | null; formCodes?: string[] | null; quantity?: number | null };
type PreviewForm = HasCase & { formCode: string; formName: string; isMandatory?: boolean | null; quantity?: number | null };
export type DossierPreviewItem = { key: string; name: string; mandatory: boolean; present: boolean; common: boolean };

/** Một dòng của hồ sơ sẽ được tạo: giấy tờ (kèm biểu mẫu gắn vào) hoặc biểu mẫu đứng riêng. */
export type WorkflowRow<I, F> = {
  key: string;
  item?: I;
  form?: F;
  forms: F[];
  mandatory: boolean;
  /** Giấy tờ không bắt buộc nhưng thành bắt buộc vì biểu mẫu bắt buộc trùng mã giấy tờ (quy tắc Workflow). */
  requiredByForm: boolean;
  quantity: number;
  common: boolean;
};

/**
 * Mô phỏng đúng cách Workflow chụp danh mục khi tạo hồ sơ (`WorkflowRequests` CreateApplication):
 * 1. Chọn giấy tờ và biểu mẫu chung + của trường hợp.
 * 2. Biểu mẫu được giấy tờ tham chiếu qua `formCodes` thì gắn vào giấy tờ đó; bắt buộc/số lượng theo giấy tờ.
 * 3. Biểu mẫu không ai tham chiếu: trùng mã giấy tờ thì gắn vào giấy tờ đó (bắt buộc |= biểu mẫu, số lượng lấy lớn hơn);
 *    không trùng thì thành một dòng riêng.
 */
export function workflowRows<I extends PreviewChecklist, F extends PreviewForm>(checklist: readonly I[], forms: readonly F[], caseCode?: string | null): WorkflowRow<I, F>[] {
  const items = applicableItems(checklist, caseCode);
  const pool = applicableItems(forms, caseCode);
  const byCode = new Map(pool.map(form => [form.formCode, form]));
  const referenced = new Set<string>();
  const rows: WorkflowRow<I, F>[] = items.map(item => {
    const linked = [...new Set(item.formCodes ?? [])].map(code => byCode.get(code)).filter((form): form is F => Boolean(form));
    linked.forEach(form => referenced.add(form.formCode));
    return { key: `c:${item.checklistId}`, item, forms: linked, mandatory: item.isMandatory !== false, requiredByForm: false, quantity: item.quantity ?? 1, common: caseKey(item.caseCode) === null };
  });
  for (const form of pool.filter(f => !referenced.has(f.formCode))) {
    const target = rows.find(row => row.item?.checklistId === form.formCode);
    if (target) {
      target.forms.push(form);
      if (!target.mandatory && form.isMandatory !== false) { target.mandatory = true; target.requiredByForm = true; }
      target.quantity = Math.max(target.quantity, form.quantity ?? 1);
    } else {
      rows.push({ key: `f:${form.formCode}`, form, forms: [form], mandatory: form.isMandatory !== false, requiredByForm: false, quantity: form.quantity ?? 1, common: caseKey(form.caseCode) === null });
    }
  }
  return rows;
}

/**
 * Xem trước danh mục hồ sơ sẽ được tạo cho một trường hợp (theo `workflowRows`).
 * Chỉ để xem trước; sau khi tạo, luôn hiển thị theo `checklists[]` của hồ sơ.
 */
export function dossierPreview(checklist: readonly PreviewChecklist[], forms: readonly PreviewForm[], caseCode?: string | null): DossierPreviewItem[] {
  return workflowRows(checklist, forms, caseCode).map(row => ({
    key: row.key,
    name: row.item?.itemName ?? (row.form?.formName || row.form?.formCode || ''),
    mandatory: row.mandatory,
    present: row.item?.submissionType === 'XUAT_TRINH',
    common: row.common,
  }));
}

/**
 * Biểu mẫu sẽ bị Workflow tách thành một mục riêng trong hồ sơ (không gắn vào giấy tờ nào), kèm các trường hợp bị ảnh hưởng.
 * Thường là lỗi dữ liệu: các mẫu thay thế của một tờ khai chưa được chọn ở ô "Mẫu đơn, tờ khai kèm theo" của giấy tờ.
 * `cases` rỗng: chỉ xét giấy tờ chung.
 */
export function standaloneForms<F extends PreviewForm>(checklist: readonly PreviewChecklist[], forms: readonly F[], cases: readonly CaseRef[]) {
  const scopes = cases.filter(c => caseKey(c.caseCode)).map(c => ({ code: c.caseCode as string, name: c.caseName?.trim() || (c.caseCode as string) }));
  const result = new Map<string, { form: F; caseNames: string[] }>();
  for (const scope of scopes.length ? scopes : [{ code: null, name: '' }]) {
    for (const row of workflowRows(checklist, forms, scope.code)) {
      if (!row.form) continue;
      const entry = result.get(row.form.formCode) ?? { form: row.form, caseNames: [] };
      if (scope.name) entry.caseNames.push(scope.name);
      result.set(row.form.formCode, entry);
    }
  }
  return [...result.values()];
}

/**
 * Các giấy tờ không bắt buộc sẽ thành bắt buộc khi tạo hồ sơ vì biểu mẫu bắt buộc trùng mã giấy tờ mà không được
 * giấy tờ nào tham chiếu qua `formCodes` (xét mọi trường hợp). Trả về mã giấy tờ → tên biểu mẫu gây ra.
 */
export function formForcedRequired(checklist: readonly PreviewChecklist[], forms: readonly PreviewForm[], cases: readonly CaseRef[]) {
  const scopes = cases.length ? cases.map(c => c.caseCode ?? null) : [null];
  const result = new Map<string, string>();
  for (const scope of scopes) {
    for (const row of workflowRows(checklist, forms, scope)) {
      if (row.requiredByForm && row.item) {
        const form = row.forms.find(f => f.formCode === row.item!.checklistId);
        result.set(row.item.checklistId, form?.formName || form?.formCode || row.item.checklistId);
      }
    }
  }
  return result;
}

/** Đếm giấy tờ: tổng, bắt buộc, cần nộp và chỉ xuất trình. */
export function countItems(items: readonly { isMandatory?: boolean | null; submissionType?: string | null }[]) {
  return {
    total: items.length,
    mandatory: items.filter(i => i.isMandatory !== false).length,
    present: items.filter(i => i.submissionType === 'XUAT_TRINH').length,
  };
}
