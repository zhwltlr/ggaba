import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/get-query-client";
import { getPosts } from "./_actions/posts";
import { communityKeys } from "@/lib/query-keys";
import CommunityPageClient from "./_components/community-page-client";

export default async function CommunityPage() {
  const queryClient = getQueryClient();

  await queryClient.prefetchInfiniteQuery({
    queryKey: communityKeys.list({ type: "all" }),
    queryFn: () => getPosts({ type: undefined }),
    initialPageParam: undefined as string | undefined,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CommunityPageClient />
    </HydrationBoundary>
  );
}
