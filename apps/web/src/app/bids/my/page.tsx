import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/get-query-client";
import { getMyBids } from "../_actions/bids";
import { bidKeys } from "@/lib/query-keys";
import MyBidsPageClient from "./_components/my-bids-page-client";

export default async function MyBidsPage() {
  const queryClient = getQueryClient();

  await queryClient.prefetchInfiniteQuery({
    queryKey: bidKeys.myList({ status: "all" }),
    queryFn: () => getMyBids({ status: undefined }),
    initialPageParam: undefined as string | undefined,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <MyBidsPageClient />
    </HydrationBoundary>
  );
}
