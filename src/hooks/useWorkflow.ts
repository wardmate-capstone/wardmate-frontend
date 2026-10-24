import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  workflowApi,
  type OfficerPendingInput,
  type OfficerListInput,
  type OfficialReceiptInput,
  type AddCommentInput,
  type RequestRevisionInput,
  type CreateApplicationInput,
  type ResubmitInput,
  type UpdateChecklistInput,
  type ReleaseApplicationInput,
  type ManageAssigneeInput,
} from '@/lib/api/workflow';
import { documentFormApi } from '@/lib/api/documentForms';
import { useAuthStore } from '@/stores/authStore';

// ==========================================
// TanStack Query Keys
// ==========================================

export const workflowQueryKeys = {
  officerPending: (filters?: OfficerPendingInput) => ['workflow', 'officer', 'pending', filters] as const,
  officerApplications: (filters?: OfficerListInput) => ['workflow', 'officer', 'applications', filters] as const,
  citizenApplications: () => ['workflow', 'citizen', 'applications'] as const,
  applicationDetail: (id?: string) => ['workflow', 'application', id] as const,
  applicationComments: (id?: string, versionNumber?: number, status?: string) => ['workflow', 'application', id, 'comments', { versionNumber, status }] as const,
  applicationVersions: (id?: string) => ['workflow', 'application', id, 'versions'] as const,
  applicationDiff: (id?: string, fromVersion?: number, toVersion?: number) => ['workflow', 'application', id, 'diff', { fromVersion, toVersion }] as const,
};

// ==========================================
// Cán bộ (Officer) Hooks
// ==========================================

export function useOfficerPendingApplications(filters: OfficerPendingInput = {}) {
  const userId = useAuthStore((state) => state.user?.id);
  return useQuery({
    queryKey: ['workflow', 'officer', 'pending', userId, filters],
    queryFn: ({ signal }) => workflowApi.listOfficerPending(filters, signal),
    enabled: Boolean(userId),
    // Tắt polling ngầm để người dùng chủ động bấm Làm mới qua nút trên bảng
    refetchInterval: false,
  });
}

export function useOfficerApplications(filters: OfficerListInput = {}) {
  const userId = useAuthStore((state) => state.user?.id);
  return useQuery({
    queryKey: ['workflow', 'officer', 'applications', userId, filters],
    queryFn: ({ signal }) => workflowApi.listOfficerApplications(filters, signal),
    enabled: Boolean(userId),
    refetchInterval: false,
  });
}

export function useAssignOfficerMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => workflowApi.assignOfficer(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['workflow', 'officer', 'pending'] });
      queryClient.invalidateQueries({ queryKey: ['workflow', 'officer', 'applications'] });
      queryClient.invalidateQueries({ queryKey: ['workflow', 'application', id] });
      queryClient.invalidateQueries({ queryKey: ['document-form', 'applications', id] });
    },
  });
}

export function useAddCommentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: AddCommentInput }) =>
      workflowApi.addComment(id, input),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['workflow', 'application', id, 'comments'] });
      queryClient.invalidateQueries({ queryKey: ['workflow', 'application', id] });
      queryClient.invalidateQueries({ queryKey: ['document-form', 'applications', id] });
    },
  });
}

export function useRequestRevisionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input, submissionId }: { id: string; input: RequestRevisionInput; submissionId?: string }) =>
      { await (submissionId ? documentFormApi.officerRequestRevision(submissionId, input.reason) : workflowApi.requestRevision(id, input)); },
    onSettled: (_, _error, { id }) => Promise.all([
      queryClient.invalidateQueries({ queryKey: ['workflow', 'officer', 'pending'] }),
      queryClient.invalidateQueries({ queryKey: ['workflow', 'officer', 'applications'] }),
      queryClient.invalidateQueries({ queryKey: ['workflow', 'application', id] }),
      queryClient.invalidateQueries({ queryKey: ['document-form', 'applications', id] }),
    ]).then(() => undefined),
  });
}

export function useConfirmReadinessMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, submissionId }: { id: string; submissionId?: string }) =>
      { await (submissionId ? documentFormApi.officerConfirmReadiness(submissionId) : workflowApi.confirmReadiness(id)); },
    onSettled: (_, _error, { id }) => Promise.all([
      queryClient.invalidateQueries({ queryKey: ['workflow', 'officer', 'pending'] }),
      queryClient.invalidateQueries({ queryKey: ['workflow', 'officer', 'applications'] }),
      queryClient.invalidateQueries({ queryKey: ['workflow', 'application', id] }),
      queryClient.invalidateQueries({ queryKey: ['document-form', 'applications', id] }),
    ]).then(() => undefined),
  });
}

// Phân công đổi cả danh sách và chi tiết; làm mới kể cả khi lỗi (409 nghĩa là dữ liệu đã khác).
function invalidateAssignment(queryClient: ReturnType<typeof useQueryClient>, id: string) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ['workflow', 'officer', 'pending'] }),
    queryClient.invalidateQueries({ queryKey: ['workflow', 'officer', 'applications'] }),
    queryClient.invalidateQueries({ queryKey: ['workflow', 'application', id] }),
  ]).then(() => undefined);
}

export function useReleaseApplicationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ReleaseApplicationInput }) => workflowApi.releaseApplication(id, input),
    onSettled: (_, _error, { id }) => invalidateAssignment(queryClient, id),
  });
}

export function useManagerAssigneeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ManageAssigneeInput }) => workflowApi.manageAssignee(id, input),
    onSettled: (_, _error, { id }) => invalidateAssignment(queryClient, id),
  });
}

export function useOfficiallyReceiveMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: OfficialReceiptInput }) =>
      workflowApi.officiallyReceiveApplication(id, input),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['workflow', 'officer', 'pending'] });
      queryClient.invalidateQueries({ queryKey: ['workflow', 'officer', 'applications'] });
      queryClient.invalidateQueries({ queryKey: ['workflow', 'application', id] });
      queryClient.invalidateQueries({ queryKey: ['document-form', 'applications', id] });
    },
  });
}


// ==========================================
// Chi tiết hồ sơ, Version & Diff Hooks
// ==========================================

export function useApplicationDetail(id?: string) {
  const userId = useAuthStore(state => state.user?.id);
  return useQuery({
    queryKey: ['workflow', 'application', id, userId],
    queryFn: ({ signal }) => workflowApi.getApplication(id!, signal),
    enabled: Boolean(id && userId),
  });
}

export function useApplicationComments(id?: string, versionNumber?: number, status?: string) {
  const userId = useAuthStore(state => state.user?.id);
  return useQuery({
    queryKey: ['workflow', 'application', id, 'comments', { versionNumber, status }, userId],
    queryFn: ({ signal }) => workflowApi.getComments(id!, versionNumber, status, signal),
    enabled: Boolean(id && userId) && (versionNumber === undefined || versionNumber > 0),
  });
}

export function useApplicationVersions(id?: string, enabled = true) {
  const userId = useAuthStore(state => state.user?.id);
  return useQuery({
    queryKey: ['workflow', 'application', id, 'versions', userId],
    queryFn: ({ signal }) => workflowApi.getVersions(id!, signal),
    enabled: enabled && Boolean(id && userId),
  });
}

export function useApplicationDiff(id?: string, fromVersion?: number, toVersion?: number, enabled = true) {
  const userId = useAuthStore(state => state.user?.id);
  return useQuery({
    queryKey: ['workflow', 'application', id, 'diff', { fromVersion, toVersion }, userId],
    queryFn: ({ signal }) => workflowApi.getDiff(id!, fromVersion!, toVersion!, signal),
    enabled: enabled && Boolean(userId && id && fromVersion && toVersion && fromVersion < toVersion),
  });
}

// ==========================================
// Công dân (Citizen) Hooks
// ==========================================

export function useCitizenApplications(page = 1, pageSize = 20) {
  const userId = useAuthStore((state) => state.user?.id);
  return useQuery({
    queryKey: ['workflow', 'citizen', 'applications', userId, { page, pageSize }],
    queryFn: ({ signal }) => workflowApi.listCitizenApplications(page, pageSize, signal),
    enabled: Boolean(userId),
    refetchInterval: false,
  });
}

export function useCreateApplicationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateApplicationInput) => workflowApi.createApplication(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow', 'citizen', 'applications'] });
    },
  });
}

export function useUpdateChecklistMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, checklistId, input }: { id: string; checklistId: string; input: UpdateChecklistInput }) =>
      workflowApi.updateChecklist(id, checklistId, input),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['workflow', 'application', id] });
      queryClient.invalidateQueries({ queryKey: ['document-form', 'applications', id] });
    },
  });
}

export function useSubmitApplicationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => workflowApi.submitApplication(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['workflow', 'citizen', 'applications'] });
      queryClient.invalidateQueries({ queryKey: ['workflow', 'application', id] });
      queryClient.invalidateQueries({ queryKey: ['document-form', 'applications', id] });
    },
  });
}

export function useResubmitApplicationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ResubmitInput }) =>
      workflowApi.resubmitApplication(id, input),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['workflow', 'citizen', 'applications'] });
      queryClient.invalidateQueries({ queryKey: ['workflow', 'application', id] });
      queryClient.invalidateQueries({ queryKey: ['document-form', 'applications', id] });
      queryClient.invalidateQueries({ queryKey: ['workflow', 'application', id, 'versions'] });
      queryClient.invalidateQueries({ queryKey: ['workflow', 'application', id, 'comments'] });
    },
  });
}

export function useCancelApplicationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => workflowApi.cancelApplication(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['workflow', 'citizen', 'applications'] });
      queryClient.invalidateQueries({ queryKey: ['workflow', 'application', id] });
      queryClient.invalidateQueries({ queryKey: ['document-form', 'applications', id] });
    },
  });
}
