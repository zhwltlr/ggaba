import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/get-query-client";
import { getOpenAuctions } from "./_actions/bids";
import { bidKeys } from "@/lib/query-keys";
import BidsPageClient from "./_components/bids-page-client";

export default async function BidsPage() {
  const queryClient = getQueryClient();

  await queryClient.prefetchInfiniteQuery({
    queryKey: bidKeys.openList({ region: "all", sizeMin: "all", sizeMax: "all" }),
    queryFn: () => getOpenAuctions({}),
    initialPageParam: undefined as string | undefined,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <BidsPageClient />
    </HydrationBoundary>
  );
}
