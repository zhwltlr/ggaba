import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/get-query-client";
import { getContractorProfile } from "../_actions/contractor";
import { contractorKeys } from "@/lib/query-keys";
import ContractorProfileClient from "./_components/contractor-profile-client";

export default async function ContractorProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const queryClient = getQueryClient();

  await queryClient.prefetchQuery({
    queryKey: contractorKeys.profile(id),
    queryFn: () => getContractorProfile(id),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ContractorProfileClient />
    </HydrationBoundary>
  );
}
