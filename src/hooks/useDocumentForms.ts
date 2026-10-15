import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { documentFormApi } from '@/lib/api/documentForms';

export const documentQueryKeys = {
  contents: (applicationId?: string) => ['document-form', 'applications', applicationId, 'contents'] as const,
  submissions: (applicantId?: string) => ['document-form', 'citizen', applicantId, 'submissions'] as const,
  generated: (applicationId?: string) => ['document-form', 'applications', applicationId, 'generated'] as const,
};

export function useApplicationContents(applicationId?: string, enabled = true) {
  return useQuery({ queryKey: documentQueryKeys.contents(applicationId), queryFn: ({ signal }) => documentFormApi.getContents(applicationId!, signal), enabled: enabled && Boolean(applicationId) });
}

export function useCitizenSubmissions(applicantId?: string, enabled = true) {
  return useQuery({ queryKey: documentQueryKeys.submissions(applicantId), queryFn: ({ signal }) => documentFormApi.listSubmissions(applicantId!, {}, signal), enabled: enabled && Boolean(applicantId) });
}

export function useGeneratedDocuments(applicationId?: string, enabled = true) {
  return useQuery({ queryKey: documentQueryKeys.generated(applicationId), queryFn: ({ signal }) => documentFormApi.listGeneratedDocuments(applicationId!, signal), enabled: enabled && Boolean(applicationId) });
}

export function useDocumentMutations() {
  const client = useQueryClient();
  const refresh = (applicationId: string, applicantId?: string) => {
    void client.invalidateQueries({ queryKey: documentQueryKeys.contents(applicationId) });
    if (applicantId) void client.invalidateQueries({ queryKey: documentQueryKeys.submissions(applicantId) });
  };
  return {
    createDraft: useMutation({ mutationFn: documentFormApi.createDraft, onSuccess: (_, input) => refresh(input.applicationId, input.applicantId) }),
    updateDraft: useMutation({ mutationFn: (input: { submissionId: string; applicationId: string; applicantId: string; file: File }) => documentFormApi.updateDraft(input.submissionId, input.applicantId, input.file), onSuccess: (_, input) => refresh(input.applicationId, input.applicantId) }),
    submitDraft: useMutation({ mutationFn: (input: { submissionId: string; applicationId: string; applicantId: string }) => documentFormApi.submitDraft(input.submissionId, input.applicantId), onSuccess: (_, input) => refresh(input.applicationId, input.applicantId) }),
    uploadSupporting: useMutation({ mutationFn: documentFormApi.uploadSupportingDocument, onSuccess: (_, input) => refresh(input.applicationId) }),
    deleteSupporting: useMutation({ mutationFn: (input: { documentId: string; applicationId: string }) => documentFormApi.deleteSupportingDocument(input.documentId), onSuccess: (_, input) => refresh(input.applicationId) }),
    generatePdf: useMutation({ mutationFn: (input: { applicationId: string; submissionId: string }) => documentFormApi.generatePdf(input.applicationId, input.submissionId), onSuccess: (_, input) => void client.invalidateQueries({ queryKey: documentQueryKeys.generated(input.applicationId) }) }),
  };
}
