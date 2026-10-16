import type { ChecklistItem } from '@/lib/procedureContent';
import type { ApplicationContentsDto } from '@/lib/api/documentForms';

export function hasChecklistEvidence(item: ChecklistItem, contents: ApplicationContentsDto) {
  if (item.formTemplateId) return contents.submissions.some(x => x.checklistId === item.checklistId && x.fileExists && x.templateId === item.formTemplateId && ['Submitted', 'Approved'].includes(x.status));
  return contents.supportingDocuments.filter(x => x.checklistId === item.checklistId && x.fileExists && (!item.submissionType || x.submissionType === item.submissionType) && (!item.documentCopyType || x.documentCopyType === item.documentCopyType)).reduce((sum, x) => sum + x.quantity, 0) >= item.quantity;
}
