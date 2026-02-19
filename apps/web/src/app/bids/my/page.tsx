"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, Skeleton } from "@ggaba/ui";
import { cn } from "@ggaba/lib/utils";
import { ClipboardList, MessagesSquare } from "lucide-react";
import { useMyBids } from "@/hooks/use-bid";
import type { BidStatus, MyBidItem } from "@/app/bids/_types";

const TABS: { label: string; value: BidStatus | undefined }[] = [
  { label: "전체", value: undefined },
  { label: "제출됨", value: "submitted" },
  { label: "선택됨", value: "selected" },
  { label: "미선택", value: "rejected" },
];

const BID_STATUS_BADGE: Record<
  BidStatus,
  { label: string; className: string }
> = {
  submitted: { label: "제출됨", className: "bg-primary/10 text-primary" },
  selected: { label: "선택됨", className: "bg-safe/10 text-safe" },
  rejected: { label: "미선택", className: "bg-muted text-muted-foreground" },
};

export default function MyBidsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<BidStatus | undefined>(undefined);
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useMyBids(activeTab);

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

  const bids = data?.pages.flatMap((page) => page.bids) ?? [];

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-xl font-bold">내 입찰 내역</h1>

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
      ) : bids.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <ClipboardList className="h-12 w-12 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            아직 입찰 내역이 없습니다
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {bids.map((bid) => (
            <MyBidCard
              key={bid.id}
              bid={bid}
              onClick={() =>
                bid.status === "selected"
                  ? router.push("/chat")
                  : router.push(`/bids/${bid.auction_id}/submit`)
              }
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

function MyBidCard({
  bid,
  onClick,
}: {
  bid: MyBidItem;
  onClick: () => void;
}) {
  const badge = BID_STATUS_BADGE[bid.status];

  return (
    <Card
      className="cursor-pointer transition-colors hover:bg-accent/30"
      onClick={onClick}
    >
      <CardContent className="flex flex-col gap-2 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">{bid.auction.title}</h3>
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
          <span>{bid.auction.region}</span>
          <span>·</span>
          <span>{bid.auction.size_pyeong}평</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-bold">
            {bid.total_price.toLocaleString()}
            <span className="text-xs font-normal text-muted-foreground">
              원
            </span>
          </span>
          <span className="text-[11px] text-muted-foreground">
            {new Date(bid.created_at).toLocaleDateString("ko-KR")}
          </span>
        </div>

        {bid.status === "selected" && (
          <div className="flex items-center gap-1.5 text-xs font-medium text-safe">
            <MessagesSquare className="h-3.5 w-3.5" />
            채팅으로 이동
          </div>
        )}
      </CardContent>
    </Card>
  );
}
