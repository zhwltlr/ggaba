import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/get-query-client";
import { getMyPortfolios } from "./_actions/portfolio";
import { portfolioKeys } from "@/lib/query-keys";
import PortfolioPageClient from "./_components/portfolio-page-client";

export default async function PortfolioPage() {
  const queryClient = getQueryClient();

  await queryClient.prefetchInfiniteQuery({
    queryKey: portfolioKeys.myList({}),
    queryFn: () => getMyPortfolios({}),
    initialPageParam: undefined as string | undefined,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PortfolioPageClient />
    </HydrationBoundary>
  );
}
