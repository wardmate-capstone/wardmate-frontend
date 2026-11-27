import type { ChecklistItem } from '@/lib/procedureContent';
import type { ApplicationContentsDto } from '@/lib/api/documentForms';

/** Giấy tờ chỉ xuất trình bản chính tại quầy, không gắn tờ khai: không bắt buộc tải tệp (WF-CASE-01, mục giấy tờ xuất trình). */
export const isPresentOnly = (item: Pick<ChecklistItem, 'submissionType' | 'formTemplateId'>) =>
  item.submissionType === 'XUAT_TRINH' && !item.formTemplateId;

/** Bằng chứng là tệp thật trong DocumentForm (tờ khai đã xác nhận hoặc đủ số bản giấy tờ). */
export function hasFileEvidence(item: ChecklistItem, contents: ApplicationContentsDto) {
  if (item.formTemplateId) {
    // BE-H: giấy tờ gắn nhiều mẫu thì điền MỘT trong các mẫu là đủ
    const templates = new Set([item.formTemplateId, ...(item.forms ?? []).map(f => f.formTemplateId).filter(Boolean)]);
    return contents.submissions.some(x => x.checklistId === item.checklistId && x.fileExists && templates.has(x.templateId) && ['Submitted', 'ReadyForDownload', 'Approved'].includes(x.status));
  }
  // Loại bản OTHER (hoặc không quy định): tải loại bản nào cũng được tính
  const anyCopyType = !item.documentCopyType || item.documentCopyType === 'OTHER';
  return contents.supportingDocuments.filter(x => x.checklistId === item.checklistId && x.fileExists && (!item.submissionType || x.submissionType === item.submissionType) && (anyCopyType || x.documentCopyType === item.documentCopyType)).reduce((sum, x) => sum + x.quantity, 0) >= item.quantity;
}

/**
 * Mục giấy tờ đã đủ để gửi tiền kiểm. Giấy tờ chỉ xuất trình: có tệp, hoặc công dân đã xác nhận sẽ mang bản chính
 * (trạng thái mục COMPLETED). BE chỉ kiểm tra trạng thái mục khi nộp, không đòi tệp.
 */
export function hasChecklistEvidence(item: ChecklistItem, contents: ApplicationContentsDto) {
  if (hasFileEvidence(item, contents)) return true;
  return isPresentOnly(item) && item.status === 'COMPLETED';
}
