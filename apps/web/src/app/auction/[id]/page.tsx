import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/get-query-client";
import { getAuctionDetail } from "../_actions/auctions";
import { auctionKeys } from "@/lib/query-keys";
import AuctionDetailClient from "./_components/auction-detail-client";

export default async function AuctionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const queryClient = getQueryClient();

  await queryClient.prefetchQuery({
    queryKey: auctionKeys.detail(id),
    queryFn: () => getAuctionDetail(id),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AuctionDetailClient />
    </HydrationBoundary>
  );
}
