"use client";

import {
  useInfiniteQuery,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { bidKeys } from "@/lib/query-keys";
import {
  getOpenAuctions,
  getOpenAuctionDetail,
  submitBid,
  getMyBids,
} from "@/app/bids/_actions/bids";
import type { BidStatus } from "@/app/bids/_types";

export function useOpenAuctions(filters?: {
  region?: string;
  sizeMin?: number;
  sizeMax?: number;
}) {
  return useInfiniteQuery({
    queryKey: bidKeys.openList({
      region: filters?.region ?? "all",
      sizeMin: filters?.sizeMin ?? "all",
      sizeMax: filters?.sizeMax ?? "all",
    }),
    queryFn: ({ pageParam }) =>
      getOpenAuctions({
        cursor: pageParam,
        region: filters?.region,
        sizeMin: filters?.sizeMin,
        sizeMax: filters?.sizeMax,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

export function useOpenAuctionDetail(auctionId: string) {
  return useQuery({
    queryKey: bidKeys.openDetail(auctionId),
    queryFn: () => getOpenAuctionDetail(auctionId),
    enabled: !!auctionId,
  });
}

export function useSubmitBid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: submitBid,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bidKeys.openLists() });
      queryClient.invalidateQueries({ queryKey: bidKeys.myLists() });
    },
  });
}

export function useMyBids(status?: BidStatus) {
  return useInfiniteQuery({
    queryKey: bidKeys.myList({ status: status ?? "all" }),
    queryFn: ({ pageParam }) => getMyBids({ status, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}
