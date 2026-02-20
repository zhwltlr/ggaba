"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardContent, Skeleton } from "@ggaba/ui";
import { cn } from "@ggaba/lib/utils";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { useAdminReports } from "@/hooks/use-admin";
import type { ReportStatus } from "@/app/admin/_actions/admin-reports";

const STATUS_TABS: { value: ReportStatus | undefined; label: string }[] = [
  { value: undefined, label: "전체" },
  { value: "pending", label: "대기" },
  { value: "reviewing", label: "검토중" },
  { value: "resolved", label: "처리완료" },
  { value: "dismissed", label: "기각" },
];

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-warning/10 text-warning",
  reviewing: "bg-primary/10 text-primary",
  resolved: "bg-safe/10 text-safe",
  dismissed: "bg-muted text-muted-foreground",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "대기",
  reviewing: "검토중",
  resolved: "처리완료",
  dismissed: "기각",
};

const REASON_LABEL: Record<string, string> = {
  fake_bid: "허위 입찰",
  inappropriate: "부적절",
  spam: "스팸",
  false_info: "허위정보",
  harassment: "괴롭힘",
  other: "기타",
};

const TARGET_LABEL: Record<string, string> = {
  post: "게시글",
  comment: "댓글",
  bid: "입찰",
};

export default function AdminReportsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ReportStatus | undefined>(
    undefined
  );
  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useAdminReports(activeTab);

  const observerRef = useRef<HTMLDivElement>(null);

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry?.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage]
  );

  useEffect(() => {
    const el = observerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(handleObserver, {
      threshold: 0.1,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleObserver]);

  const reports = data?.pages.flatMap((p) => p.reports) ?? [];

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.push("/admin")}
          className="rounded-full p-1 hover:bg-muted"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold">신고 관리</h1>
      </div>

      {/* 탭 필터 */}
      <div className="flex gap-2 overflow-x-auto">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.label}
            type="button"
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              "whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              activeTab === tab.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 목록 */}
      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          신고 내역이 없습니다.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {reports.map((report) => (
            <Card
              key={report.id}
              className="cursor-pointer transition-colors hover:bg-accent/50"
              onClick={() => router.push(`/admin/reports/${report.id}`)}
            >
              <CardContent className="flex items-center gap-3 p-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-medium",
                        STATUS_BADGE[report.status]
                      )}
                    >
                      {STATUS_LABEL[report.status]}
                    </span>
                    <span className="rounded bg-accent px-1.5 py-0.5 text-[10px]">
                      {TARGET_LABEL[report.target_type] ?? report.target_type}
                    </span>
                    <span className="rounded bg-accent px-1.5 py-0.5 text-[10px]">
                      {REASON_LABEL[report.reason] ?? report.reason}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    신고자: {report.reporter_nickname} → 대상:{" "}
                    {report.target_user_nickname}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(report.created_at).toLocaleDateString("ko-KR")}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </CardContent>
            </Card>
          ))}
          <div ref={observerRef} className="h-4" />
          {isFetchingNextPage && (
            <Skeleton className="h-20 w-full rounded-lg" />
          )}
        </div>
      )}
    </div>
  );
}
