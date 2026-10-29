import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { knowledgeApi, type KnowledgeListQuery } from '@/lib/api/aiOcr';
import { useAuthStore } from '@/stores/authStore';

export function useCanManageKnowledge() {
  return useAuthStore(state => !!state.user?.permissions.includes('knowledge.manage'));
}

function useKnowledgeKey() {
  const userId = useAuthStore(state => state.user?.id);
  return ['ai-knowledge', userId] as const;
}

export function useKnowledgeDocuments(query: KnowledgeListQuery) {
  const key = useKnowledgeKey();
  const enabled = useCanManageKnowledge();
  return useQuery({
    queryKey: [...key, 'documents', query],
    queryFn: ({ signal }) => knowledgeApi.list(query, signal),
    enabled,
    placeholderData: keepPreviousData,
  });
}

export function useKnowledgeDocument(id?: string) {
  const key = useKnowledgeKey();
  const enabled = useCanManageKnowledge();
  return useQuery({
    queryKey: [...key, 'document', id],
    queryFn: ({ signal }) => knowledgeApi.get(id!, signal),
    enabled: enabled && !!id,
    staleTime: 0,
  });
}

export function useKnowledgeChunks(id: string | undefined, pageNumber: number) {
  const key = useKnowledgeKey();
  const enabled = useCanManageKnowledge();
  return useQuery({
    queryKey: [...key, 'document', id, 'chunks', pageNumber],
    queryFn: ({ signal }) => knowledgeApi.chunks(id!, pageNumber, 20, signal),
    enabled: enabled && !!id,
    placeholderData: keepPreviousData,
  });
}

export function useKnowledgeIndexStatus() {
  const key = useKnowledgeKey();
  const enabled = useCanManageKnowledge();
  return useQuery({
    queryKey: [...key, 'index-status'],
    queryFn: ({ signal }) => knowledgeApi.indexStatus(signal),
    enabled,
  });
}

// The server may persist before a timeout/sync error, so refresh the knowledge cache after both outcomes.
export function useKnowledgeMutation<TInput, TResult>(mutationFn: (input: TInput) => Promise<TResult>) {
  const queryClient = useQueryClient();
  const key = useKnowledgeKey();
  return useMutation({
    mutationFn,
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  });
}

// Search is a mutation on purpose: each call costs one embedding, so it must never refetch on its own.
export function useKnowledgeSearch() {
  return useMutation({ mutationFn: ({ query, topK }: { query: string; topK: number }) => knowledgeApi.search(query, topK) });
}
