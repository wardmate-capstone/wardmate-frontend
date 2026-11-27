import { procedureIssue, type ProcedureIssue } from '@/lib/procedureValidation';

/**
 * Xuất bản BẢN NHÁP (POST /procedure-manager/drafts/{id}/publish): Catalog `DraftPayloadRequirements` bắt mỗi cách nộp
 * phải có `feeAmount`, `feeUnit`, `estimatedDays` khác null (luồng tạo/sửa thủ tục thường thì cho null).
 * FE không đổi BE và không tự điền giá trị mặc định: chỉ lấy đúng số người dùng đã nhập (giống cách BE tự suy ra
 * ở luồng thường), còn thiếu thì chỉ rõ ô cần điền trước khi gửi.
 */
type Row = Record<string, unknown>;
const record = (v: unknown): Row => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Row) : {});
const rows = (v: unknown): Row[] => (Array.isArray(v) ? v.map(record) : []);
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const DAY_UNITS = new Set(['DAY', 'WORKING_DAY']);

/** Điền số ngày/số tiền/đơn vị từ chính dữ liệu người dùng đã nhập (thời hạn theo ngày, các mức phí). */
export function deriveMethodNumbers(method: Row): Row {
  const next = { ...method };
  const time = record(method.processingTime);
  if (next.estimatedDays == null && num(time.value) != null && DAY_UNITS.has(String(time.unit ?? ''))) next.estimatedDays = num(time.value);
  const fees = rows(method.fees);
  const amounts = fees.map(f => num(f.amount)).filter((n): n is number => n != null);
  if (next.feeAmount == null && amounts.length) next.feeAmount = Math.min(...amounts);
  const unit = fees.map(f => String(f.unit ?? '').trim()).find(Boolean);
  if (!String(next.feeUnit ?? '').trim() && unit) next.feeUnit = unit;
  return next;
}

export function prepareDraftPayloadForPublish(payload: Row): Row {
  const content = record(payload.contentPayload);
  if (!Array.isArray(content.submissionMethods)) return payload;
  return { ...payload, contentPayload: { ...content, submissionMethods: rows(content.submissionMethods).map(deriveMethodNumbers) } };
}

const methodLabel = (method: Row, i: number) => {
  const name = String(method.methodName ?? '').trim();
  return `Cách nộp ${i + 1}${name ? ` (${name})` : ''}`;
};
const missing = (v: unknown) => v == null || (typeof v === 'string' && !v.trim());

/** Lỗi thân thiện cho một trường số liệu của cách nộp; `recheck` để danh sách lỗi tự cập nhật khi người dùng sửa. */
function methodIssue(i: number, field: 'estimatedDays' | 'feeAmount' | 'feeUnit', payload: unknown): ProcedureIssue {
  const method = rows(record(record(payload).contentPayload).submissionMethods)[i] ?? {};
  const base = `contentPayload.submissionMethods.${i}`;
  const hasFees = rows(method.fees).length > 0;
  const stillMissing = (value: unknown) => {
    const current = rows(record(prepareDraftPayloadForPublish(record(value)).contentPayload).submissionMethods)[i];
    return Boolean(current) && missing(current![field]);
  };
  if (field === 'estimatedDays') {
    return { path: `${base}.processingTime.value`, step: 3, label: `${methodLabel(method, i)} – Thời hạn giải quyết`, message: 'Nhập số ngày ở ô “Số” và chọn đơn vị “Ngày” hoặc “Ngày làm việc”.', recheck: stillMissing };
  }
  if (field === 'feeAmount') {
    return { path: hasFees ? `${base}.fees.0.amount` : `${base}.fees`, step: 3, label: `${methodLabel(method, i)} – Phí, lệ phí`, message: hasFees ? 'Nhập số tiền ở mức phí (nhập 0 nếu miễn phí).' : 'Bấm “Thêm mức phí” và nhập số tiền (nhập 0 nếu miễn phí).', recheck: stillMissing };
  }
  return { path: hasFees ? `${base}.fees.0.unit` : `${base}.fees`, step: 3, label: `${methodLabel(method, i)} – Đơn vị phí`, message: 'Nhập đơn vị ở mức phí, VD: VND.', recheck: stillMissing };
}

/** Các điều kiện xuất bản bản nháp mà kiểm tra lưu thông thường không bắt (số liệu cách nộp). */
export function draftPublishIssues(payload: Row): ProcedureIssue[] {
  const prepared = prepareDraftPayloadForPublish(payload);
  const issues: ProcedureIssue[] = [];
  rows(record(prepared.contentPayload).submissionMethods).forEach((method, i) => {
    (['estimatedDays', 'feeAmount', 'feeUnit'] as const).forEach(field => {
      if (missing(method[field])) issues.push(methodIssue(i, field, prepared));
    });
  });
  return issues;
}

/**
 * Lỗi 400 `validation.failed` của BE (khóa dạng `contentPayload.submissionMethods[0].estimatedDays`) → lỗi dễ hiểu,
 * chỉ tới đúng phần/ô trên màn hình; không hiện tên trường kỹ thuật cho người dùng.
 */
export function issuesFromServerErrors(errors: Record<string, unknown>, payload: Row): ProcedureIssue[] {
  return Object.keys(errors).map(key => {
    const path = key.replace(/\[(\d+)\]/g, '.$1').replace(/^\$\.?/, '');
    const method = /^contentPayload\.submissionMethods\.(\d+)\.(estimatedDays|feeAmount|feeUnit)$/i.exec(path);
    if (method) return methodIssue(Number(method[1]), method[2].replace(/^./, c => c.toLowerCase()) as 'estimatedDays' | 'feeAmount' | 'feeUnit', payload);
    const normalized = path.replace(/(^|\.)([A-Z])/g, (_, dot: string, c: string) => dot + c.toLowerCase());
    return {
      ...procedureIssue(normalized, 'Vui lòng điền thông tin này trước khi xuất bản.'),
      recheck: (value: unknown) => missing(normalized.split('.').reduce<unknown>((acc, part) => record(acc)[part] ?? (Array.isArray(acc) ? acc[Number(part)] : undefined), value)),
    };
  });
}
