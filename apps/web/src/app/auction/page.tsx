import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/get-query-client";
import { getMyAuctions } from "./_actions/auctions";
import { auctionKeys } from "@/lib/query-keys";
import AuctionPageClient from "./_components/auction-page-client";

export default async function AuctionPage() {
  const queryClient = getQueryClient();

  await queryClient.prefetchInfiniteQuery({
    queryKey: auctionKeys.list({ status: "all" }),
    queryFn: () => getMyAuctions({ status: undefined }),
    initialPageParam: undefined as string | undefined,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AuctionPageClient />
    </HydrationBoundary>
  );
}
