import { caseKey } from '@/lib/procedureCases';

/** Thao tác dữ liệu trường hợp trong trình sửa thủ tục (WF-CASE-01). Dữ liệu là JSON thô của form, không phải DTO đã kiểm tra. */
type Row = Record<string, unknown>;
const record = (value: unknown): Row => (value && typeof value === 'object' && !Array.isArray(value) ? (value as Row) : {});
const rows = (value: unknown): Row[] => (Array.isArray(value) ? value.map(record) : []);
const text = (value: unknown) => (value == null ? '' : String(value));

/** Đổi mã trường hợp và mọi chỗ đang trỏ tới mã cũ (giấy tờ, biểu mẫu, cách nộp, mức phí). */
export function renameCase(value: Row, index: number, nextCode: string): Row {
  const content = record(value.contentPayload);
  const cases = rows(content.cases);
  const oldCode = text(cases[index]?.caseCode);
  const owned = (row: Row) => caseKey(text(row.caseCode)) !== null && text(row.caseCode) === oldCode;
  const swap = (row: Row) => (owned(row) ? { ...row, caseCode: nextCode } : row);
  return {
    ...value,
    checklistSchema: rows(value.checklistSchema).map(swap),
    formDefinitions: rows(value.formDefinitions).map(swap),
    contentPayload: {
      ...content,
      cases: cases.map((c, i) => (i === index ? { ...c, caseCode: nextCode } : c)),
      submissionMethods: rows(content.submissionMethods).map(method => {
        const next = swap(method);
        return Array.isArray(method.fees) ? { ...next, fees: rows(method.fees).map(swap) } : next;
      }),
    },
  };
}

/**
 * Xóa trường hợp: giấy tờ riêng chuyển thành giấy tờ chung hoặc bị xóa theo lựa chọn;
 * biểu mẫu/cách nộp/mức phí gắn trường hợp chuyển về áp dụng chung (Catalog trả 400 nếu còn trỏ tới mã đã xóa).
 */
export function removeCase(value: Row, index: number, documents: 'common' | 'delete', forms: 'common' | 'delete' = 'common'): Row {
  const content = record(value.contentPayload);
  const cases = rows(content.cases);
  const code = text(cases[index]?.caseCode);
  const owned = (row: Row) => caseKey(text(row.caseCode)) !== null && text(row.caseCode) === code;
  const toCommon = (row: Row) => (owned(row) ? { ...row, caseCode: null } : row);
  const removedForms = new Set(forms === 'delete' ? rows(value.formDefinitions).filter(owned).map(f => text(f.formCode)) : []);
  // Giấy tờ còn lại không được tham chiếu biểu mẫu đã xóa (Catalog từ chối formCodes không tồn tại)
  const dropRemovedForms = (row: Row) => {
    if (!removedForms.size || !Array.isArray(row.formCodes)) return row;
    const next = (row.formCodes as unknown[]).map(text).filter(c => !removedForms.has(c));
    return { ...row, formCodes: next.length ? next : null };
  };
  const checklist = documents === 'delete' ? rows(value.checklistSchema).filter(row => !owned(row)) : rows(value.checklistSchema).map(toCommon);
  return {
    ...value,
    checklistSchema: checklist.map(dropRemovedForms),
    formDefinitions: forms === 'delete' ? rows(value.formDefinitions).filter(row => !owned(row)) : rows(value.formDefinitions).map(toCommon),
    contentPayload: {
      ...content,
      cases: cases.filter((_, i) => i !== index),
      submissionMethods: rows(content.submissionMethods).map(method => {
        const next = toCommon(method);
        return Array.isArray(method.fees) ? { ...next, fees: rows(method.fees).map(toCommon) } : next;
      }),
    },
  };
}

/** Biểu mẫu riêng của trường hợp sẽ trùng mã với biểu mẫu chung nếu chuyển về áp dụng chung (Catalog từ chối). */
export function caseFormConflicts(value: Row, index: number): string[] {
  const code = text(rows(record(value.contentPayload).cases)[index]?.caseCode);
  const forms = rows(value.formDefinitions);
  const common = new Set(forms.filter(f => caseKey(text(f.caseCode)) === null).map(f => text(f.formCode)));
  return forms.filter(f => caseKey(text(f.caseCode)) !== null && text(f.caseCode) === code && common.has(text(f.formCode))).map(f => text(f.formCode));
}

/**
 * Đổi "Áp dụng cho" của giấy tờ: bỏ tham chiếu tới biểu mẫu không còn áp dụng (biểu mẫu của trường hợp khác).
 * Trả về giấy tờ mới và các mã biểu mẫu đã bỏ để báo người dùng.
 */
export function moveChecklistItem(item: Row, nextCase: string | null, forms: readonly Row[]): { item: Row; droppedForms: string[] } {
  const allowed = new Set(forms.filter(f => { const fc = caseKey(text(f.caseCode)); return fc === null || fc === nextCase; }).map(f => text(f.formCode)));
  const current = Array.isArray(item.formCodes) ? (item.formCodes as unknown[]).map(text) : [];
  const kept = current.filter(c => allowed.has(c));
  return { item: { ...item, caseCode: nextCase, formCodes: Array.isArray(item.formCodes) ? (kept.length ? kept : null) : item.formCodes }, droppedForms: current.filter(c => !allowed.has(c)) };
}

/**
 * Gắn các biểu mẫu vào một giấy tờ (thành mẫu thay thế trong ô "Mẫu đơn, tờ khai kèm theo").
 * Giấy tờ thuộc trường hợp nào thì biểu mẫu chuyển sang trường hợp đó, để ở trường hợp khác Workflow không tách biểu mẫu
 * thành mục riêng. Giấy tờ chung thì giữ biểu mẫu áp dụng chung.
 */
export function attachFormsToItem(value: Row, itemIndex: number, formCodes: readonly string[]): Row {
  const checklist = rows(value.checklistSchema);
  const target = checklist[itemIndex];
  if (!target) return value;
  const owner = caseKey(text(target.caseCode));
  const codes = new Set(formCodes);
  const current = Array.isArray(target.formCodes) ? (target.formCodes as unknown[]).map(text) : [];
  return {
    ...value,
    checklistSchema: checklist.map((row, i) => (i === itemIndex ? { ...row, formCodes: [...new Set([...current, ...formCodes])] } : row)),
    formDefinitions: rows(value.formDefinitions).map(form => (codes.has(text(form.formCode)) ? { ...form, caseCode: owner } : form)),
  };
}

/** Mã gợi ý cho giấy tờ mới, không trùng mã đã có (Catalog yêu cầu mã giấy tờ duy nhất). */
export function uniqueChecklistId(list: readonly Row[]) {
  const used = new Set(list.map(row => text(row.checklistId)));
  let n = list.length + 1;
  while (used.has(`GT-${n}`)) n += 1;
  return `GT-${n}`;
}
