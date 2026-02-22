import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/get-query-client";
import { getPost } from "../_actions/posts";
import { communityKeys } from "@/lib/query-keys";
import CommunityDetailClient from "./_components/community-detail-client";

export default async function CommunityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const queryClient = getQueryClient();

  await queryClient.prefetchQuery({
    queryKey: communityKeys.detail(id),
    queryFn: () => getPost(id),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CommunityDetailClient />
    </HydrationBoundary>
  );
}
