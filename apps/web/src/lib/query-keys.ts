/**
 * TanStack Query 키 팩토리
 *
 * 패턴: [domain, scope, ...params]
 * 계층적 키 구조로 관련 쿼리를 한번에 무효화 가능
 *
 * @example
 *   queryClient.invalidateQueries({ queryKey: estimateKeys.all })
 *   // → estimates 관련 모든 쿼리 무효화
 *
 *   queryClient.invalidateQueries({ queryKey: estimateKeys.lists() })
 *   // → 목록 쿼리만 무효화 (상세는 유지)
 */

export const estimateKeys = {
  all: ["estimates"] as const,
  lists: () => [...estimateKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) =>
    [...estimateKeys.lists(), filters] as const,
  details: () => [...estimateKeys.all, "detail"] as const,
  detail: (id: string) => [...estimateKeys.details(), id] as const,
  diagnosis: (id: string) => [...estimateKeys.all, "diagnosis", id] as const,
  items: (estimateId: string) =>
    [...estimateKeys.all, "items", estimateId] as const,
};

export const userKeys = {
  all: ["users"] as const,
  me: () => [...userKeys.all, "me"] as const,
  detail: (id: string) => [...userKeys.all, "detail", id] as const,
  estimates: (userId: string) =>
    [...userKeys.all, "estimates", userId] as const,
};

export const communityKeys = {
  all: ["community"] as const,
  lists: () => [...communityKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) =>
    [...communityKeys.lists(), filters] as const,
  detail: (id: string) => [...communityKeys.all, "detail", id] as const,
  comments: (postId: string) =>
    [...communityKeys.all, "comments", postId] as const,
};
