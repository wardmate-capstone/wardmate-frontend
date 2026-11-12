import { createContext } from 'react';
import { PROCEDURE_LIMITS, procedureInputSchema, type ProcedureInput, type ChecklistUpdateInput } from '@/lib/api/procedures';

// Trần BE-H (10/11/2026): trường một dòng 10.000 ký tự, số quyết định 255
const LINE = PROCEDURE_LIMITS.singleLine;

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
  const step = path.startsWith('formDefinitions') ? 4 : path.startsWith('checklistSchema') ? 1
    : path.startsWith('contentPayload.cases') || path.startsWith('contentPayload.commonSteps') || path.startsWith('contentPayload.stepsText') ? 2
    : path.startsWith('contentPayload.submissionMethods') ? 3 : path.startsWith('contentPayload.legalReferences') ? 5
    : path.startsWith('contentPayload.additionalSections') ? 6 : 0;
  const parts = path.split('.');
  const last = parts.at(-1)!;
  // Nhãn riêng cho trường trùng tên ở nhiều nhóm (title, name, note...)
  const scoped = path.startsWith('contentPayload.additionalSections') ? { title: 'Tiêu đề mục', content: 'Nội dung mục' }[last]
    : path.startsWith('contentPayload.resultDetails') ? { name: 'Tên kết quả', code: 'Mã kết quả' }[last]
    : path.includes('.fees.') ? { amount: 'Số tiền', percent: 'Tỷ lệ %', unit: 'Đơn vị phí' }[last] : undefined;
  const label = scoped ?? labels[last] ?? ['Thông tin chung', 'Thành phần hồ sơ', 'Trường hợp thực hiện', 'Thời hạn và lệ phí', 'Biểu mẫu', 'Căn cứ pháp lý', 'Thông tin khác'][step];
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
  maxLength(data.issuingAuthority, LINE, ['issuingAuthority']);
  maxLength(data.executingAgency, LINE, ['executingAgency']);
  maxLength(data.contentPayload.decisionNumber, PROCEDURE_LIMITS.decisionNumber, ['contentPayload', 'decisionNumber']);
  // BE (09/11) chỉ bắt buộc mã, tên, lĩnh vực; các trường còn lại được để trống
  maxLength(data.levelOfImplementation, PROCEDURE_LIMITS.levelOfImplementation, ['levelOfImplementation']);
  maxLength(data.targetAudience, LINE, ['targetAudience']);
  maxLength(data.feeSummary, LINE, ['feeSummary']);
  maxLength(data.processingTimeSummary, LINE, ['processingTimeSummary']);
  // Tổng nội dung (contentPayload + checklist + biểu mẫu) tối đa 500.000 ký tự
  if (JSON.stringify([data.contentPayload, data.checklistSchema ?? [], data.formDefinitions ?? []]).length > PROCEDURE_LIMITS.totalContent)
    context.addIssue({ code: 'custom', path: ['contentPayload'], message: 'Tổng nội dung thủ tục vượt 500.000 ký tự. Hãy rút gọn hoặc đưa bớt vào PDF gốc.' });
  // Bước thực hiện (BE-H): chỉ cần tên hoặc nội dung; thứ tự là số nguyên không âm
  function checkStep(step: { stepOrder: number; stepName: string; actionDetails: string }, path: (string | number)[]) {
    if (!step.stepName?.trim() && !step.actionDetails?.trim()) context.addIssue({ code: 'custom', path: [...path, 'stepName'], message: 'Nhập tên bước hoặc nội dung thực hiện.' });
    if (!Number.isInteger(step.stepOrder) || step.stepOrder < 0 || step.stepOrder > 2147483647) context.addIssue({ code: 'custom', path: [...path, 'stepOrder'], message: 'Nhập thứ tự là số nguyên không âm.' });
  }
  const content = data.contentPayload;
  maxLength(content.procedureType, LINE, ['contentPayload', 'procedureType']);
  content.commonSteps?.forEach((step, j) => checkStep(step, ['contentPayload', 'commonSteps', j]));
  for (const key of ['levels', 'competentAuthorities', 'executingAgencies', 'authorizedAgencies', 'coordinatingAgencies', 'receivingAddresses', 'keywords'] as const) {
    const list = content[key];
    if (list && list.length > PROCEDURE_LIMITS.listItems) context.addIssue({ code: 'custom', path: ['contentPayload', key], message: `Tối đa ${PROCEDURE_LIMITS.listItems} mục.` });
    list?.forEach((text, i) => maxLength(text, LINE, ['contentPayload', key, i]));
  }
  content.resultDetails?.forEach((row, i) => {
    required(row.name ?? '', ['contentPayload', 'resultDetails', i, 'name']);
    maxLength(row.code, 255, ['contentPayload', 'resultDetails', i, 'code']);
  });
  if ((content.additionalSections?.length ?? 0) > PROCEDURE_LIMITS.sections) context.addIssue({ code: 'custom', path: ['contentPayload', 'additionalSections'], message: 'Tối đa 50 mục thông tin khác.' });
  content.additionalSections?.forEach((section, i) => {
    required(section.title ?? '', ['contentPayload', 'additionalSections', i, 'title']);
    maxLength(section.title, PROCEDURE_LIMITS.sectionTitle, ['contentPayload', 'additionalSections', i, 'title']);
  });
  const codes = new Set(data.contentPayload.cases.map(item => item.caseCode?.trim()).filter(Boolean));
  const seen = new Set<string>();
  data.contentPayload.cases.forEach((item, i) => {
    required(item.caseCode, ['contentPayload', 'cases', i, 'caseCode']);
    maxLength(item.caseCode, 100, ['contentPayload', 'cases', i, 'caseCode']);
    if (item.caseCode && item.caseCode !== item.caseCode.trim()) {
      context.addIssue({ code: 'custom', path: ['contentPayload', 'cases', i, 'caseCode'], message: 'Mã trường hợp không được có khoảng trắng đầu/cuối.' });
    }
    required(item.caseName, ['contentPayload', 'cases', i, 'caseName']);
    item.steps.forEach((step, j) => checkStep(step, ['contentPayload', 'cases', i, 'steps', j]));
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
    maxLength(item.itemName, LINE, ['checklistSchema', i, 'itemName']);
    maxLength(item.quantityText, LINE, ['checklistSchema', i, 'quantityText']);
    if ((item.formCodes?.length ?? 0) > PROCEDURE_LIMITS.formCodes) context.addIssue({ code: 'custom', path: ['checklistSchema', i, 'formCodes'], message: 'Một giấy tờ gắn tối đa 20 mẫu.' });
    for (const formCode of item.formCodes ?? []) {
      const linked = (data.formDefinitions ?? []).some(form => form.formCode === formCode && (!form.caseCode?.trim() || form.caseCode === item.caseCode));
      if (!linked) context.addIssue({ code: 'custom', path: ['checklistSchema', i, 'formCodes'], message: `Mẫu "${formCode}" không có ở tab Biểu mẫu hoặc thuộc trường hợp khác với giấy tờ.` });
    }
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
    maxLength(form.formName, LINE, ['formDefinitions', i, 'formName']);
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
    // Phí/thời hạn có thể để trống hoặc ghi bằng chữ (feeText, processingTime.text) — chỉ kiểm khi có số
    if (method.feeAmount != null && !method.feeUnit?.trim()) required('', ['contentPayload', 'submissionMethods', i, 'feeUnit']);
    if (method.caseCode && !codes.has(method.caseCode.trim())) context.addIssue({ code: 'custom', path: ['contentPayload', 'submissionMethods', i, 'caseCode'], message: 'Trường hợp áp dụng phải thuộc thủ tục.' });
    if ((method.fees?.length ?? 0) > PROCEDURE_LIMITS.fees) context.addIssue({ code: 'custom', path: ['contentPayload', 'submissionMethods', i, 'fees'], message: 'Tối đa 100 mức phí cho một cách nộp.' });
    method.fees?.forEach((fee, j) => {
      if ((fee.amount ?? 0) < 0) context.addIssue({ code: 'custom', path: ['contentPayload', 'submissionMethods', i, 'fees', j, 'amount'], message: 'Số tiền phải lớn hơn hoặc bằng 0.' });
      if (fee.percent != null && (fee.percent < 0 || fee.percent > 100)) context.addIssue({ code: 'custom', path: ['contentPayload', 'submissionMethods', i, 'fees', j, 'percent'], message: 'Tỷ lệ phải từ 0 đến 100.' });
      if (fee.amount == null && fee.percent == null && !fee.description?.trim()) context.addIssue({ code: 'custom', path: ['contentPayload', 'submissionMethods', i, 'fees', j, 'amount'], message: 'Nhập số tiền, tỷ lệ % hoặc mô tả; dòng trống thì xóa đi.' });
      maxLength(fee.unit, 50, ['contentPayload', 'submissionMethods', i, 'fees', j, 'unit']);
    });
    if ((method.processingTime?.value ?? 0) < 0) context.addIssue({ code: 'custom', path: ['contentPayload', 'submissionMethods', i, 'processingTime', 'value'], message: 'Thời hạn phải lớn hơn hoặc bằng 0.' });
    for (const key of ['feeAmount', 'estimatedDays'] as const) if ((method[key] ?? 0) < 0) context.addIssue({ code: 'custom', path: ['contentPayload', 'submissionMethods', i, key], message: 'Giá trị phải lớn hơn hoặc bằng 0.' });
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
    } else if (itemName.length > LINE) {
      issues.push(procedureIssue(`checklistSchema.${i}.itemName`, 'Tên giấy tờ tối đa 10.000 ký tự.'));
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
  if (result.success) return [];
  const rawIssues = result.error.issues.map(issue => {
    const path = issue.path.join('.');
    const message = issue.code === 'custom' ? issue.message : path.endsWith('.quantity') ? 'Nhập số nguyên từ 1 đến 2147483647.' : path === 'title' ? 'Tên thủ tục không được để trống, tối đa 1.000 ký tự.' : path === 'procedureCode' ? 'Mã thủ tục phải có từ 1 đến 100 ký tự.' : undefined;
    return procedureIssue(path, message);
  });

  // Khử trùng lặp issue theo path: giữ thông báo cụ thể nhất cho mỗi trường
  const uniqueIssues = new Map<string, ProcedureIssue>();
  for (const item of rawIssues) {
    const existing = uniqueIssues.get(item.path);
    if (!existing) {
      uniqueIssues.set(item.path, item);
    } else {
      const isGeneric = existing.message.startsWith('Vui lòng nhập') && existing.message.endsWith('hợp lệ.');
      if (isGeneric) {
        uniqueIssues.set(item.path, item);
      }
    }
  }

  return Array.from(uniqueIssues.values()).sort((a, b) => a.step - b.step);
}
export class ProcedureValidationError extends Error {
  constructor(public issues: ProcedureIssue[]) {
    super('Chưa thể lưu hoặc xuất bản. Vui lòng kiểm tra:\n• ' + issues.map(issue => `${issue.label}: ${issue.message}`).join('\n• '));
  }
}
export function validateProcedure(value: unknown): ProcedureInput {
  const result = saveSchema.safeParse(value);
  if (!result.success) throw new ProcedureValidationError(getProcedureIssues(value));
  // Tên bóc tách từ PDF hay giữ dấu xuống dòng của bảng gốc; gộp thành một dòng để không lỗi ở nơi khác
  // (vd: kho kiến thức AI từ chối tiêu đề có ký tự điều khiển khi đồng bộ thủ tục)
  return { ...result.data, title: result.data.title.replace(/\s+/g, ' ').trim() };
}
