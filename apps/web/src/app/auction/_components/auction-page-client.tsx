"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardContent, Skeleton } from "@ggaba/ui";
import { cn } from "@ggaba/lib/utils";
import { Gavel, Plus } from "lucide-react";
import { useMyAuctions } from "@/hooks/use-auction";
import type { AuctionStatus, AuctionItem } from "@/app/auction/_types";

const TABS: { label: string; value: AuctionStatus | undefined }[] = [
  { label: "전체", value: undefined },
  { label: "입찰 대기", value: "open" },
  { label: "입찰 중", value: "bidding" },
  { label: "선택됨", value: "selected" },
  { label: "완료", value: "completed" },
];

const STATUS_BADGE: Record<AuctionStatus, { label: string; className: string }> = {
  open: { label: "입찰 대기", className: "bg-primary/10 text-primary" },
  bidding: { label: "입찰 중", className: "bg-warning/10 text-warning" },
  selected: { label: "선택됨", className: "bg-safe/10 text-safe" },
  in_progress: { label: "시공 중", className: "bg-info/10 text-info" },
  completed: { label: "완료", className: "bg-muted text-muted-foreground" },
  cancelled: { label: "취소", className: "bg-danger/10 text-danger" },
};

export default function AuctionPageClient() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AuctionStatus | undefined>(
    undefined
  );
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useMyAuctions(activeTab);

  const observerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = observerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const auctions = data?.pages.flatMap((page) => page.auctions) ?? [];

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">내 경매</h1>
        <Button size="sm" onClick={() => router.push("/auction/new")}>
          <Plus className="mr-1.5 h-4 w-4" />
          시공 요청하기
        </Button>
      </div>

      {/* 탭 필터 */}
      <div className="flex gap-2 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.label}
            type="button"
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
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
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="flex flex-col gap-3 p-4">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : auctions.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <Gavel className="h-12 w-12 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            아직 경매 요청이 없습니다
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/auction/new")}
          >
            첫 시공 요청 등록하기
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {auctions.map((auction) => (
            <AuctionCard
              key={auction.id}
              auction={auction}
              onClick={() => router.push(`/auction/${auction.id}`)}
            />
          ))}

          <div ref={observerRef} className="h-4" />
          {isFetchingNextPage && (
            <div className="flex justify-center py-4">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AuctionCard({
  auction,
  onClick,
}: {
  auction: AuctionItem;
  onClick: () => void;
}) {
  const badge = STATUS_BADGE[auction.status];
  const timeAgo = getTimeAgo(auction.created_at);

  const budgetText =
    auction.budget_min && auction.budget_max
      ? `${auction.budget_min.toLocaleString()}~${auction.budget_max.toLocaleString()}만원`
      : auction.budget_min
        ? `${auction.budget_min.toLocaleString()}만원~`
        : auction.budget_max
          ? `~${auction.budget_max.toLocaleString()}만원`
          : null;

  return (
    <Card
      className="cursor-pointer transition-colors hover:bg-accent/30"
      onClick={onClick}
    >
      <CardContent className="flex flex-col gap-2 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">{auction.title}</h3>
          <span
            className={cn(
              "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium",
              badge.className
            )}
          >
            {badge.label}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{auction.region}</span>
          <span>·</span>
          <span>{auction.size_pyeong}평</span>
          {budgetText && (
            <>
              <span>·</span>
              <span>{budgetText}</span>
            </>
          )}
        </div>

        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>입찰 {auction.bid_count}건</span>
          <span>{timeAgo}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function getTimeAgo(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "방금";
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}일 전`;
  return new Date(dateStr).toLocaleDateString("ko-KR");
}
