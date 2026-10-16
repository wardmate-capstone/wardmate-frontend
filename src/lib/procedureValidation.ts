import { createContext } from 'react';
import { procedureInputSchema, type ProcedureInput, type ChecklistUpdateInput } from '@/lib/api/procedures';

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
  const codes = new Set(data.contentPayload.cases.map(item => item.caseCode?.trim()).filter(Boolean));
  const seen = new Set<string>();
  data.contentPayload.cases.forEach((item, i) => {
    required(item.caseCode, ['contentPayload', 'cases', i, 'caseCode']);
    maxLength(item.caseCode, 100, ['contentPayload', 'cases', i, 'caseCode']);
    if (item.caseCode && item.caseCode !== item.caseCode.trim()) {
      context.addIssue({ code: 'custom', path: ['contentPayload', 'cases', i, 'caseCode'], message: 'Mã trường hợp không được có khoảng trắng đầu/cuối.' });
    }
    required(item.caseName, ['contentPayload', 'cases', i, 'caseName']);
    item.steps.forEach((step, j) => {
      required(step.stepName, ['contentPayload', 'cases', i, 'steps', j, 'stepName']);
      if (!Number.isInteger(step.stepOrder) || step.stepOrder < 1 || step.stepOrder > 2147483647) context.addIssue({ code: 'custom', path: ['contentPayload', 'cases', i, 'steps', j, 'stepOrder'], message: 'Nhập thứ tự là số nguyên từ 1 đến 2147483647.' });
    });
    if (seen.has(item.caseCode)) context.addIssue({ code: 'custom', path: ['contentPayload', 'cases', i, 'caseCode'], message: 'Mã trường hợp bị trùng.' });
    seen.add(item.caseCode);
  });

  if (data.checklistSchema && data.checklistSchema.length > 500) {
    context.addIssue({ code: 'custom', path: ['checklistSchema'], message: 'Checklist tối đa 500 mục.' });
  }
  const seenChecklist = new Set<string>();
  data.checklistSchema?.forEach((item, i) => {
    required(item.checklistId, ['checklistSchema', i, 'checklistId']);
    maxLength(item.checklistId, 255, ['checklistSchema', i, 'checklistId']);
    if (item.checklistId && item.checklistId !== item.checklistId.trim()) {
      context.addIssue({ code: 'custom', path: ['checklistSchema', i, 'checklistId'], message: 'Mã giấy tờ không được có khoảng trắng đầu/cuối.' });
    }
    if (item.checklistId) {
      if (seenChecklist.has(item.checklistId)) {
        context.addIssue({ code: 'custom', path: ['checklistSchema', i, 'checklistId'], message: 'Mã giấy tờ không được trùng.' });
      }
      seenChecklist.add(item.checklistId);
    }
    required(item.itemName, ['checklistSchema', i, 'itemName']);
    maxLength(item.itemName, 255, ['checklistSchema', i, 'itemName']);
    if (item.caseCode && !codes.has(item.caseCode.trim())) {
      context.addIssue({ code: 'custom', path: ['checklistSchema', i, 'caseCode'], message: 'Mã trường hợp của giấy tờ phải thuộc thủ tục.' });
    }
  });

  data.formDefinitions?.forEach((form, i) => {
    required(form.formCode, ['formDefinitions', i, 'formCode']);
    maxLength(form.formCode, 255, ['formDefinitions', i, 'formCode']);
    if (form.formCode && form.formCode !== form.formCode.trim()) {
      context.addIssue({ code: 'custom', path: ['formDefinitions', i, 'formCode'], message: 'Mã biểu mẫu không được có khoảng trắng đầu/cuối.' });
    }
    required(form.formName, ['formDefinitions', i, 'formName']);
    maxLength(form.formName, 255, ['formDefinitions', i, 'formName']);
    if (form.formTemplateId === '00000000-0000-0000-0000-000000000000') {
      context.addIssue({ code: 'custom', path: ['formDefinitions', i, 'formTemplateId'], message: 'Mã template không được là GUID rỗng.' });
    }
    if (form.caseCode && !codes.has(form.caseCode.trim())) {
      context.addIssue({ code: 'custom', path: ['formDefinitions', i, 'caseCode'], message: 'Mã trường hợp của biểu mẫu phải thuộc thủ tục.' });
    }
  });
  if (data.formDefinitions) {
    const formGroups = new Map<string, Array<{ caseCode?: string | null; index: number }>>();
    data.formDefinitions.forEach((f, i) => {
      const code = f.formCode?.trim();
      if (!code) return;
      const list = formGroups.get(code) ?? [];
      list.push({ caseCode: f.caseCode, index: i });
      formGroups.set(code, list);
    });
    for (const [, entries] of formGroups.entries()) {
      if (entries.length > 1) {
        const hasCommon = entries.some(e => !e.caseCode?.trim());
        const caseCodes = entries.map(e => e.caseCode?.trim()).filter(Boolean);
        const uniqueCases = new Set(caseCodes);
        if (hasCommon || uniqueCases.size !== entries.length) {
          entries.forEach(e => {
            context.addIssue({
              code: 'custom',
              path: ['formDefinitions', e.index, 'formCode'],
              message: 'Mã biểu mẫu không được trùng trong cùng trường hợp hoặc trùng với biểu mẫu dùng chung.',
            });
          });
        }
      }
    }
  }

  data.contentPayload.submissionMethods.forEach((method, i) => {
    required(method.methodName, ['contentPayload', 'submissionMethods', i, 'methodName']);
    required(method.feeUnit, ['contentPayload', 'submissionMethods', i, 'feeUnit']);
    for (const key of ['feeAmount', 'estimatedDays'] as const) if (method[key] < 0) context.addIssue({ code: 'custom', path: ['contentPayload', 'submissionMethods', i, key], message: 'Giá trị phải lớn hơn hoặc bằng 0.' });
  });
  data.contentPayload.results.forEach((result, i) => required(result, ['contentPayload', 'results', i]));
});

export function validateChecklistItems(
  items: unknown,
  allowedCases: Array<{ caseCode?: string | null }>,
): ChecklistUpdateInput['items'] {
  const codes = new Set(allowedCases.map(c => c.caseCode?.trim()).filter(Boolean));
  if (!Array.isArray(items)) {
    throw new ProcedureValidationError([procedureIssue('checklistSchema', 'Danh sách giấy tờ phải là mảng.')]);
  }
  if (items.length > 500) {
    throw new ProcedureValidationError([procedureIssue('checklistSchema', 'Checklist tối đa 500 mục.')]);
  }
  const issues: ProcedureIssue[] = [];
  const seenChecklist = new Set<string>();
  items.forEach((raw, i) => {
    const item = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
    const checklistId = String(item.checklistId ?? '');
    const itemName = String(item.itemName ?? '');
    const caseCode = item.caseCode ? String(item.caseCode).trim() : null;
    if (!checklistId.trim()) {
      issues.push(procedureIssue(`checklistSchema.${i}.checklistId`, 'Mã giấy tờ không được để trống.'));
    } else {
      if (checklistId.length > 255) {
        issues.push(procedureIssue(`checklistSchema.${i}.checklistId`, 'Mã giấy tờ tối đa 255 ký tự.'));
      }
      if (checklistId !== checklistId.trim()) {
        issues.push(procedureIssue(`checklistSchema.${i}.checklistId`, 'Mã giấy tờ không được có khoảng trắng đầu/cuối.'));
      }
      if (seenChecklist.has(checklistId)) {
        issues.push(procedureIssue(`checklistSchema.${i}.checklistId`, 'Mã giấy tờ không được trùng.'));
      }
      seenChecklist.add(checklistId);
    }
    if (!itemName.trim()) {
      issues.push(procedureIssue(`checklistSchema.${i}.itemName`, 'Tên giấy tờ không được để trống.'));
    } else if (itemName.length > 255) {
      issues.push(procedureIssue(`checklistSchema.${i}.itemName`, 'Tên giấy tờ tối đa 255 ký tự.'));
    }
    if (caseCode && !codes.has(caseCode)) {
      issues.push(procedureIssue(`checklistSchema.${i}.caseCode`, 'Mã trường hợp phải thuộc các trường hợp của thủ tục.'));
    }
    const quantity = Number(item.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 2147483647) {
      issues.push(procedureIssue(`checklistSchema.${i}.quantity`, 'Số lượng phải là số nguyên từ 1 đến 2147483647.'));
    }
  });
  if (issues.length > 0) {
    throw new ProcedureValidationError(issues);
  }
  return items as ChecklistUpdateInput['items'];
}
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
