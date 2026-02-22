import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/get-query-client";
import { getChatRoomDetail, getMessages } from "../_actions/chat";
import { chatKeys } from "@/lib/query-keys";
import ChatRoomClient from "./_components/chat-room-client";

export default async function ChatRoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;
  const queryClient = getQueryClient();

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: chatKeys.room(roomId),
      queryFn: () => getChatRoomDetail(roomId),
    }),
    queryClient.prefetchInfiniteQuery({
      queryKey: chatKeys.messages(roomId),
      queryFn: () => getMessages({ roomId }),
      initialPageParam: undefined as string | undefined,
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ChatRoomClient />
    </HydrationBoundary>
  );
}
