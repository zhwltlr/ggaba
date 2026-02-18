"use client";

import {
  useInfiniteQuery,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { auctionKeys } from "@/lib/query-keys";
import {
  getMyAuctions,
  getAuctionDetail,
  selectBid,
} from "@/app/auction/_actions/auctions";
import type { AuctionStatus } from "@/app/auction/_types";

export function useMyAuctions(status?: AuctionStatus) {
  return useInfiniteQuery({
    queryKey: auctionKeys.list({ status: status ?? "all" }),
    queryFn: ({ pageParam }) => getMyAuctions({ status, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

export function useAuctionDetail(id: string) {
  return useQuery({
    queryKey: auctionKeys.detail(id),
    queryFn: () => getAuctionDetail(id),
    enabled: !!id,
  });
}

export function useSelectBid(auctionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bidId: string) => selectBid({ auctionId, bidId }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: auctionKeys.detail(auctionId),
      });
      queryClient.invalidateQueries({ queryKey: auctionKeys.lists() });
    },
  });
}
