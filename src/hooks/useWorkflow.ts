import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  workflowApi,
  type OfficerPendingInput,
  type AddCommentInput,
  type RequestRevisionInput,
  type RejectInput,
  type CreateApplicationInput,
  type ResubmitInput,
  type UpdateChecklistInput,
} from '@/lib/api/workflow';
import { useAuthStore } from '@/stores/authStore';

// ==========================================
// TanStack Query Keys
// ==========================================

export const workflowQueryKeys = {
  officerPending: (filters?: OfficerPendingInput) => ['workflow', 'officer', 'pending', filters] as const,
  citizenApplications: (params?: { page?: number; pageSize?: number }) => ['workflow', 'citizen', 'applications', params] as const,
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
    refetchInterval: 15_000, // Tự động làm mới danh sách mỗi 15 giây
  });
}

export function useAssignOfficerMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => workflowApi.assignOfficer(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['workflow', 'officer', 'pending'] });
      queryClient.invalidateQueries({ queryKey: ['workflow', 'application', id] });
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
    },
  });
}

export function useRequestRevisionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: RequestRevisionInput }) =>
      workflowApi.requestRevision(id, input),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['workflow', 'officer', 'pending'] });
      queryClient.invalidateQueries({ queryKey: ['workflow', 'application', id] });
    },
  });
}

export function useApproveApplicationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => workflowApi.approveApplication(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['workflow', 'officer', 'pending'] });
      queryClient.invalidateQueries({ queryKey: ['workflow', 'application', id] });
    },
  });
}

export function useRejectApplicationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: RejectInput }) =>
      workflowApi.rejectApplication(id, input),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['workflow', 'officer', 'pending'] });
      queryClient.invalidateQueries({ queryKey: ['workflow', 'application', id] });
    },
  });
}

// ==========================================
// Chi tiết hồ sơ, Version & Diff Hooks
// ==========================================

export function useApplicationDetail(id?: string) {
  return useQuery({
    queryKey: ['workflow', 'application', id],
    queryFn: ({ signal }) => workflowApi.getApplication(id!, signal),
    enabled: Boolean(id),
  });
}

export function useApplicationComments(id?: string, versionNumber?: number, status?: string) {
  return useQuery({
    queryKey: ['workflow', 'application', id, 'comments', { versionNumber, status }],
    queryFn: ({ signal }) => workflowApi.getComments(id!, versionNumber, status, signal),
    enabled: Boolean(id),
  });
}

export function useApplicationVersions(id?: string) {
  return useQuery({
    queryKey: ['workflow', 'application', id, 'versions'],
    queryFn: ({ signal }) => workflowApi.getVersions(id!, signal),
    enabled: Boolean(id),
  });
}

export function useApplicationDiff(id?: string, fromVersion?: number, toVersion?: number) {
  return useQuery({
    queryKey: ['workflow', 'application', id, 'diff', { fromVersion, toVersion }],
    queryFn: ({ signal }) => workflowApi.getDiff(id!, fromVersion!, toVersion!, signal),
    enabled: Boolean(id && fromVersion && toVersion && fromVersion !== toVersion),
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
    refetchInterval: 30_000,
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
      queryClient.invalidateQueries({ queryKey: ['workflow', 'application', id, 'versions'] });
      queryClient.invalidateQueries({ queryKey: ['workflow', 'application', id, 'comments'] });
    },
  });
}
