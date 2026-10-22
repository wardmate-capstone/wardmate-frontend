import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { documentFormApi } from '@/lib/api/documentForms';
import { useAuthStore } from '@/stores/authStore';

export const documentQueryKeys = {
  application: (applicationId?: string) => ['document-form', 'applications', applicationId] as const,
  contents: (applicationId?: string) => [...documentQueryKeys.application(applicationId), 'contents'] as const,
  submissions: (applicantId?: string) => ['document-form', 'citizen', applicantId, 'submissions'] as const,
  generated: (applicationId?: string) => [...documentQueryKeys.application(applicationId), 'generated'] as const,
  qr: (applicationId?: string) => [...documentQueryKeys.application(applicationId), 'qr'] as const,
};

export function useApplicationContents(applicationId?: string, enabled = true) {
  const userId = useAuthStore(s => s.user?.id);
  return useQuery({ queryKey: [...documentQueryKeys.contents(applicationId), userId], queryFn: ({ signal }) => documentFormApi.getContents(applicationId!, signal), enabled: enabled && Boolean(applicationId && userId) });
}
export function useCitizenSubmissions(applicantId?: string, enabled = true, params: { status?: string; page?: number; pageSize?: number } = {}) {
  const userId = useAuthStore(s => s.user?.id);
  return useQuery({ queryKey: [...documentQueryKeys.submissions(applicantId), userId, params], queryFn: ({ signal }) => documentFormApi.listSubmissions(applicantId!, params, signal), enabled: enabled && Boolean(applicantId && applicantId === userId) });
}
export function useOfficerSubmissions(applicationId: string) {
  const user = useAuthStore(s => s.user);
  return useQuery({ queryKey: [...documentQueryKeys.application(applicationId), 'officer-submissions', user?.id], queryFn: ({ signal }) => documentFormApi.officerListSubmissions(applicationId, signal), enabled: Boolean(applicationId && user?.roles.includes('FRONT_DESK_OFFICER')) });
}
export function useGeneratedDocuments(applicationId?: string, enabled = true, submissionId?: string) {
  const userId = useAuthStore(s => s.user?.id);
  return useQuery({ queryKey: [...documentQueryKeys.generated(applicationId), userId, submissionId], queryFn: ({ signal }) => documentFormApi.listGeneratedDocuments(applicationId!, signal, submissionId), enabled: enabled && Boolean(applicationId && userId) });
}
export function useApprovedQr(applicationId?: string) {
  const userId = useAuthStore(s => s.user?.id);
  return useQuery({ queryKey: [...documentQueryKeys.qr(applicationId), userId], queryFn: ({ signal }) => documentFormApi.getApprovedQr(applicationId!, signal), enabled: Boolean(applicationId && userId) });
}
export function useDocumentMutations() {
  const client = useQueryClient();
  const userId = useAuthStore(s => s.user?.id);
  const refresh = async (applicationId: string, applicantId?: string) => {
    await Promise.all([
      client.invalidateQueries({ queryKey: documentQueryKeys.application(applicationId) }),
      ...(applicantId ? [client.invalidateQueries({ queryKey: documentQueryKeys.submissions(applicantId) })] : []),
    ]);
  };
  return {
    createDraft: useMutation({ mutationFn: documentFormApi.createDraft, onSuccess: (_, input) => refresh(input.applicationId, input.applicantId) }),
    uploadFilledDocx: useMutation({ mutationFn: documentFormApi.uploadFilledDocx, onSuccess: (_, input) => refresh(input.applicationId, input.applicantId) }),
    updateDraft: useMutation({ mutationFn: (input: { submissionId: string; applicationId: string; applicantId: string; file: File }) => documentFormApi.updateDraft(input.submissionId, input.applicantId, input.file), onSuccess: (_, input) => refresh(input.applicationId, input.applicantId) }),
    submitDraft: useMutation({ mutationFn: (input: { submissionId: string; applicationId: string; applicantId: string }) => documentFormApi.submitDraft(input.submissionId, input.applicantId), onSuccess: (_, input) => refresh(input.applicationId, input.applicantId) }),
    uploadSupporting: useMutation({ mutationFn: documentFormApi.uploadSupportingDocument, onSuccess: (_, input) => refresh(input.applicationId) }),
    deleteSupporting: useMutation({ mutationFn: (input: { documentId: string; applicationId: string }) => documentFormApi.deleteSupportingDocument(input.documentId), onSuccess: (_, input) => refresh(input.applicationId) }),
    annotate: useMutation({
      mutationFn: (input: { submissionId: string; applicationId: string; file: File }) => documentFormApi.officerAnnotateSubmission(input.submissionId, input.file),
      onSettled: (_, _error, input) => Promise.all([
        refresh(input.applicationId),
        client.invalidateQueries({ queryKey: ['workflow', 'application', input.applicationId] }),
        client.invalidateQueries({ queryKey: ['document-binary', userId, input.submissionId] }),
      ]).then(() => undefined),
    }),
    generatePdf: useMutation({ mutationFn: (input: { applicationId: string; submissionId: string }) => documentFormApi.generatePdf(input.applicationId, input.submissionId), onSuccess: (_, input) => refresh(input.applicationId) }),
  };
}
