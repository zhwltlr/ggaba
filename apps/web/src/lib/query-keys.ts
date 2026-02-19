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

export const auctionKeys = {
  all: ["auctions"] as const,
  lists: () => [...auctionKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) =>
    [...auctionKeys.lists(), filters] as const,
  details: () => [...auctionKeys.all, "detail"] as const,
  detail: (id: string) => [...auctionKeys.details(), id] as const,
};

export const bidKeys = {
  all: ["bids"] as const,
  openLists: () => [...bidKeys.all, "open"] as const,
  openList: (filters: Record<string, unknown>) =>
    [...bidKeys.openLists(), filters] as const,
  openDetail: (id: string) => [...bidKeys.all, "open-detail", id] as const,
  myLists: () => [...bidKeys.all, "my"] as const,
  myList: (filters: Record<string, unknown>) =>
    [...bidKeys.myLists(), filters] as const,
};

export const portfolioKeys = {
  all: ["portfolios"] as const,
  myLists: () => [...portfolioKeys.all, "my"] as const,
  myList: (filters: Record<string, unknown>) =>
    [...portfolioKeys.myLists(), filters] as const,
  details: () => [...portfolioKeys.all, "detail"] as const,
  detail: (id: string) => [...portfolioKeys.details(), id] as const,
  byContractor: (contractorId: string) =>
    [...portfolioKeys.all, "contractor", contractorId] as const,
};

export const contractorKeys = {
  all: ["contractors"] as const,
  profile: (id: string) => [...contractorKeys.all, "profile", id] as const,
};

export const reviewKeys = {
  all: ["reviews"] as const,
  byContractor: (contractorId: string) =>
    [...reviewKeys.all, "contractor", contractorId] as const,
};

export const chatKeys = {
  all: ["chats"] as const,
  rooms: () => [...chatKeys.all, "rooms"] as const,
  room: (id: string) => [...chatKeys.all, "room", id] as const,
  messages: (roomId: string) => [...chatKeys.all, "messages", roomId] as const,
};
