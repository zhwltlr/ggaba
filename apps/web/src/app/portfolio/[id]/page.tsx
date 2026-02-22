import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/get-query-client";
import { getPortfolio } from "../_actions/portfolio";
import { portfolioKeys } from "@/lib/query-keys";
import PortfolioDetailClient from "./_components/portfolio-detail-client";

export default async function PortfolioDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const queryClient = getQueryClient();

  await queryClient.prefetchQuery({
    queryKey: portfolioKeys.detail(id),
    queryFn: () => getPortfolio(id),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PortfolioDetailClient />
    </HydrationBoundary>
  );
}
