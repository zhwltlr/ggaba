"use client";

import {
  useInfiniteQuery,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { chatKeys } from "@/lib/query-keys";
import {
  getChatRooms,
  getChatRoomDetail,
  getMessages,
  sendMessage,
  markAsRead,
} from "@/app/chat/_actions/chat";

export function useChatRooms() {
  return useQuery({
    queryKey: chatKeys.rooms(),
    queryFn: getChatRooms,
    staleTime: 30_000,
  });
}

export function useChatRoomDetail(roomId: string) {
  return useQuery({
    queryKey: chatKeys.room(roomId),
    queryFn: () => getChatRoomDetail(roomId),
    staleTime: 30_000,
    enabled: !!roomId,
  });
}

export function useMessages(roomId: string) {
  return useInfiniteQuery({
    queryKey: chatKeys.messages(roomId),
    queryFn: ({ pageParam }) => getMessages({ roomId, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 0,
    enabled: !!roomId,
  });
}

export function useSendMessage(roomId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { content: string; type?: "text" | "image" | "file" }) =>
      sendMessage({ roomId, ...input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.messages(roomId) });
      queryClient.invalidateQueries({ queryKey: chatKeys.rooms() });
    },
  });
}

export function useMarkAsRead(roomId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => markAsRead(roomId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.rooms() });
    },
  });
}
