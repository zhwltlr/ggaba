"use client";

import {
  useInfiniteQuery,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { portfolioKeys } from "@/lib/query-keys";
import {
  getMyPortfolios,
  getPortfolio,
  getPortfoliosByContractor,
  createPortfolio,
  updatePortfolio,
  deletePortfolio,
} from "@/app/portfolio/_actions/portfolio";
import type { PortfolioInput } from "@/app/portfolio/_types";

export function useMyPortfolios() {
  return useInfiniteQuery({
    queryKey: portfolioKeys.myList({}),
    queryFn: ({ pageParam }) => getMyPortfolios({ cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

export function usePortfolio(id: string) {
  return useQuery({
    queryKey: portfolioKeys.detail(id),
    queryFn: () => getPortfolio(id),
    enabled: !!id,
  });
}

export function useContractorPortfolios(contractorId: string) {
  return useInfiniteQuery({
    queryKey: portfolioKeys.byContractor(contractorId),
    queryFn: ({ pageParam }) =>
      getPortfoliosByContractor(contractorId, { cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!contractorId,
  });
}

export function useCreatePortfolio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: PortfolioInput) => createPortfolio(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: portfolioKeys.myLists() });
    },
  });
}

export function useUpdatePortfolio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: PortfolioInput }) =>
      updatePortfolio(id, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: portfolioKeys.myLists() });
      queryClient.invalidateQueries({
        queryKey: portfolioKeys.detail(variables.id),
      });
    },
  });
}

export function useDeletePortfolio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deletePortfolio(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: portfolioKeys.myLists() });
    },
  });
}
