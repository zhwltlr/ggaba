import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/get-query-client";
import { getChatRooms } from "./_actions/chat";
import { chatKeys } from "@/lib/query-keys";
import ChatListClient from "./_components/chat-list-client";

export default async function ChatListPage() {
  const queryClient = getQueryClient();

  await queryClient.prefetchQuery({
    queryKey: chatKeys.rooms(),
    queryFn: getChatRooms,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ChatListClient />
    </HydrationBoundary>
  );
}
