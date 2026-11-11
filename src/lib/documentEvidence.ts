import type { ChecklistItem } from '@/lib/procedureContent';
import type { ApplicationContentsDto } from '@/lib/api/documentForms';

export function hasChecklistEvidence(item: ChecklistItem, contents: ApplicationContentsDto) {
  if (item.formTemplateId) {
    // BE-H: giấy tờ gắn nhiều mẫu thì điền MỘT trong các mẫu là đủ
    const templates = new Set([item.formTemplateId, ...(item.forms ?? []).map(f => f.formTemplateId).filter(Boolean)]);
    return contents.submissions.some(x => x.checklistId === item.checklistId && x.fileExists && templates.has(x.templateId) && ['Submitted', 'ReadyForDownload', 'Approved'].includes(x.status));
  }
  // Loại bản OTHER (hoặc không quy định): tải loại bản nào cũng được tính
  const anyCopyType = !item.documentCopyType || item.documentCopyType === 'OTHER';
  return contents.supportingDocuments.filter(x => x.checklistId === item.checklistId && x.fileExists && (!item.submissionType || x.submissionType === item.submissionType) && (anyCopyType || x.documentCopyType === item.documentCopyType)).reduce((sum, x) => sum + x.quantity, 0) >= item.quantity;
}
