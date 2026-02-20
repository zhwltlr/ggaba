"use client";

import {
  useInfiniteQuery,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { reportKeys, penaltyKeys } from "@/lib/query-keys";
import {
  getReports,
  getReportDetail,
  resolveReport,
  type ReportStatus,
} from "@/app/admin/_actions/admin-reports";
import {
  getPenalties,
  issuePenalty,
  revokePenalty,
  type PenaltyFilter,
} from "@/app/admin/_actions/admin-penalties";

export function useAdminReports(status?: ReportStatus) {
  return useInfiniteQuery({
    queryKey: reportKeys.list({ status: status ?? "all" }),
    queryFn: ({ pageParam }) => getReports({ status, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

export function useAdminReportDetail(id: string) {
  return useQuery({
    queryKey: reportKeys.detail(id),
    queryFn: () => getReportDetail(id),
    enabled: !!id,
  });
}

export function useResolveReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: resolveReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reportKeys.all });
    },
  });
}

export function useAdminPenalties(filter?: PenaltyFilter) {
  return useInfiniteQuery({
    queryKey: penaltyKeys.list({ filter: filter ?? "all" }),
    queryFn: ({ pageParam }) => getPenalties({ filter, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

export function useIssuePenalty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: issuePenalty,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: penaltyKeys.all });
      queryClient.invalidateQueries({ queryKey: reportKeys.all });
    },
  });
}

export function useRevokePenalty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: revokePenalty,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: penaltyKeys.all });
    },
  });
}
