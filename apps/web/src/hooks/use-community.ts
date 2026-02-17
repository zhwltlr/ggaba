"use client";

import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { communityKeys } from "@/lib/query-keys";
import {
  getPosts,
  getPost,
  addComment,
  type PostType,
} from "@/app/community/_actions/posts";

export function useCommunityPosts(type?: PostType) {
  return useInfiniteQuery({
    queryKey: communityKeys.list({ type: type ?? "all" }),
    queryFn: ({ pageParam }) => getPosts({ type, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

export function useCommunityPost(id: string) {
  return useQuery({
    queryKey: communityKeys.detail(id),
    queryFn: () => getPost(id),
    enabled: !!id,
  });
}

export function useAddComment(postId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { content: string; parentId?: string }) =>
      addComment({ postId, ...input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: communityKeys.detail(postId) });
    },
  });
}
