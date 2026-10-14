import { createContext } from 'react';
import { procedureInputSchema, type ProcedureInput } from '@/lib/api/procedures';

export type ProcedureIssue = { path: string; label: string; step: number; message: string };
export const ProcedureErrorsContext = createContext<Record<string, string>>({});
export const ProcedureFieldPrefix = createContext('');
const labels: Record<string, string> = {
  procedureCode: 'Mã thủ tục', categoryId: 'Danh mục', title: 'Tên thủ tục', issuingAuthority: 'Cơ quan ban hành', levelOfImplementation: 'Cấp thực hiện',
  targetAudience: 'Đối tượng thực hiện', feeSummary: 'Tóm tắt lệ phí', processingTimeSummary: 'Tóm tắt thời hạn',
  decisionNumber: 'Số quyết định', receivingAddress: 'Địa chỉ tiếp nhận', results: 'Kết quả giải quyết',
  formTemplateId: 'Liên kết biểu mẫu', formCode: 'Mã biểu mẫu', formName: 'Tên biểu mẫu', formType: 'Loại biểu mẫu',
  quantity: 'Số lượng', caseCode: 'Trường hợp áp dụng', caseName: 'Tên trường hợp', isMandatory: 'Yêu cầu bắt buộc',
  checklistId: 'Mã giấy tờ', itemName: 'Tên giấy tờ', submissionType: 'Hình thức giấy tờ', documentCopyType: 'Loại bản sao',
  methodName: 'Hình thức nộp', feeAmount: 'Lệ phí', feeUnit: 'Đơn vị lệ phí', estimatedDays: 'Thời hạn',
  stepOrder: 'Thứ tự', stepName: 'Tên bước', executor: 'Người thực hiện', actionDetails: 'Nội dung thực hiện',
  documentNumber: 'Số văn bản', documentName: 'Tên văn bản', issueDate: 'Ngày ban hành',
};
export function procedureIssue(path: string, message?: string): ProcedureIssue {
  const step = path.startsWith('formDefinitions') ? 4 : path.startsWith('checklistSchema') ? 1 : path.startsWith('contentPayload.cases') ? 2 : path.startsWith('contentPayload.submissionMethods') ? 3 : path.startsWith('contentPayload.legalReferences') ? 5 : 0;
  const parts = path.split('.');
  const label = labels[parts.at(-1)!] ?? ['Thông tin chung', 'Thành phần hồ sơ', 'Trường hợp thực hiện', 'Thời hạn và lệ phí', 'Biểu mẫu', 'Căn cứ pháp lý'][step];
  const indexes = parts.filter(part => /^\d+$/.test(part)).map(part => Number(part) + 1);
  return { path, step, label: label + (indexes.length ? ` (dòng ${indexes.join(', ')})` : ''), message: message ?? `Vui lòng nhập ${label.toLocaleLowerCase('vi-VN')} hợp lệ.` };
}

// Strict save validation: never invent names, legal fees, durations or quantities.
const saveSchema = procedureInputSchema.superRefine((data, context) => {
  const required = (text: string, path: (string | number)[]) => {
    if (!text.trim()) context.addIssue({ code: 'custom', path, message: 'Thông tin này không được để trống.' });
  };
  const maxLength = (text: string | null | undefined, max: number, path: (string | number)[]) => {
    if (text && text.length > max) context.addIssue({ code: 'custom', path, message: `Nhập tối đa ${max} ký tự.` });
  };
  maxLength(data.issuingAuthority, 255, ['issuingAuthority']);
  maxLength(data.contentPayload.decisionNumber, 100, ['contentPayload', 'decisionNumber']);
  for (const key of ['levelOfImplementation', 'targetAudience', 'feeSummary', 'processingTimeSummary'] as const) required(data[key], [key]);
  const codes = new Set(data.contentPayload.cases.map(item => item.caseCode));
  const seen = new Set<string>();
  data.contentPayload.cases.forEach((item, i) => {
    required(item.caseCode, ['contentPayload', 'cases', i, 'caseCode']);
    required(item.caseName, ['contentPayload', 'cases', i, 'caseName']);
    item.steps.forEach((step, j) => {
      required(step.stepName, ['contentPayload', 'cases', i, 'steps', j, 'stepName']);
      if (!Number.isInteger(step.stepOrder) || step.stepOrder < 1 || step.stepOrder > 2147483647) context.addIssue({ code: 'custom', path: ['contentPayload', 'cases', i, 'steps', j, 'stepOrder'], message: 'Nhập thứ tự là số nguyên từ 1 đến 2147483647.' });
    });
    if (seen.has(item.caseCode)) context.addIssue({ code: 'custom', path: ['contentPayload', 'cases', i, 'caseCode'], message: 'Mã trường hợp bị trùng.' });
    seen.add(item.caseCode);
  });
  for (const key of ['formDefinitions', 'checklistSchema'] as const) {
    data[key]?.forEach((item, i) => {
      if (item.caseCode && !codes.has(item.caseCode)) context.addIssue({ code: 'custom', path: [key, i, 'caseCode'], message: 'Trường hợp đã bị xóa hoặc không tồn tại. Vui lòng chọn lại.' });
      if (key === 'formDefinitions') {
        const form = data.formDefinitions![i];
        required(form.formCode, [key, i, 'formCode']); required(form.formName, [key, i, 'formName']);
      } else {
        const item = data.checklistSchema![i];
        required(item.checklistId, [key, i, 'checklistId']); required(item.itemName, [key, i, 'itemName']);
        maxLength(item.itemName, 255, [key, i, 'itemName']);
      }
    });
  }
  data.contentPayload.submissionMethods.forEach((method, i) => {
    required(method.methodName, ['contentPayload', 'submissionMethods', i, 'methodName']);
    required(method.feeUnit, ['contentPayload', 'submissionMethods', i, 'feeUnit']);
    for (const key of ['feeAmount', 'estimatedDays'] as const) if (method[key] < 0) context.addIssue({ code: 'custom', path: ['contentPayload', 'submissionMethods', i, key], message: 'Giá trị phải lớn hơn hoặc bằng 0.' });
  });
  data.contentPayload.results.forEach((result, i) => required(result, ['contentPayload', 'results', i]));
});
export function getProcedureIssues(value: unknown): ProcedureIssue[] {
  const result = saveSchema.safeParse(value);
  return result.success ? [] : result.error.issues.map(issue => {
    const path = issue.path.join('.');
    const message = issue.code === 'custom' ? issue.message : path.endsWith('.quantity') ? 'Nhập số nguyên từ 1 đến 2147483647.' : path === 'title' ? 'Tên thủ tục phải có từ 10 đến 500 ký tự.' : path === 'procedureCode' ? 'Mã thủ tục phải có từ 1 đến 50 ký tự.' : undefined;
    return procedureIssue(path, message);
  }).sort((a, b) => a.step - b.step);
}
export class ProcedureValidationError extends Error {
  constructor(public issues: ProcedureIssue[]) {
    super('Chưa thể lưu hoặc xuất bản. Vui lòng kiểm tra:\n• ' + issues.map(issue => `${issue.label}: ${issue.message}`).join('\n• '));
  }
}
export function validateProcedure(value: unknown): ProcedureInput {
  const result = saveSchema.safeParse(value);
  if (!result.success) throw new ProcedureValidationError(getProcedureIssues(value));
  return result.data;
}
