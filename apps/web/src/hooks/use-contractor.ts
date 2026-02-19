"use client";

import { useQuery } from "@tanstack/react-query";
import { contractorKeys } from "@/lib/query-keys";
import { getContractorProfile } from "@/app/contractor/_actions/contractor";

export function useContractorProfile(contractorId: string) {
  return useQuery({
    queryKey: contractorKeys.profile(contractorId),
    queryFn: () => getContractorProfile(contractorId),
    enabled: !!contractorId,
  });
}
