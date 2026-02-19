"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { reviewKeys, contractorKeys } from "@/lib/query-keys";
import {
  getContractorReviews,
  createReview,
} from "@/app/reviews/_actions/reviews";

export function useContractorReviews(contractorId: string) {
  return useInfiniteQuery({
    queryKey: reviewKeys.byContractor(contractorId),
    queryFn: ({ pageParam }) =>
      getContractorReviews(contractorId, { cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!contractorId,
  });
}

export function useCreateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createReview,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: reviewKeys.byContractor(variables.partnerId),
      });
      queryClient.invalidateQueries({
        queryKey: contractorKeys.profile(variables.partnerId),
      });
    },
  });
}
