"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, Input, Skeleton } from "@ggaba/ui";
import { cn } from "@ggaba/lib/utils";
import { ClipboardList, Clock } from "lucide-react";
import { useOpenAuctions } from "@/hooks/use-bid";
import type { OpenAuctionItem } from "@/app/bids/_types";

const REGIONS = [
  "서울", "경기", "인천", "부산", "대구", "광주",
  "대전", "울산", "세종", "강원", "충북", "충남",
  "전북", "전남", "경북", "경남", "제주",
];

export default function BidsPageClient() {
  const router = useRouter();
  const [region, setRegion] = useState<string | undefined>(undefined);
  const [sizeMin, setSizeMin] = useState<number | undefined>(undefined);
  const [sizeMax, setSizeMax] = useState<number | undefined>(undefined);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useOpenAuctions({ region, sizeMin, sizeMax });

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
      <h1 className="text-xl font-bold">입찰 가능 경매</h1>

      {/* 지역 필터 */}
      <div className="flex gap-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setRegion(undefined)}
          className={cn(
            "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
            region === undefined
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-accent"
          )}
        >
          전체
        </button>
        {REGIONS.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRegion(region === r ? undefined : r)}
            className={cn(
              "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              region === r
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent"
            )}
          >
            {r}
          </button>
        ))}
      </div>

      {/* 평수 범위 필터 */}
      <div className="flex items-center gap-2">
        <Input
          type="number"
          placeholder="최소 평수"
          className="h-9 w-24 text-sm"
          value={sizeMin ?? ""}
          onChange={(e) =>
            setSizeMin(e.target.value ? Number(e.target.value) : undefined)
          }
        />
        <span className="text-sm text-muted-foreground">~</span>
        <Input
          type="number"
          placeholder="최대 평수"
          className="h-9 w-24 text-sm"
          value={sizeMax ?? ""}
          onChange={(e) =>
            setSizeMax(e.target.value ? Number(e.target.value) : undefined)
          }
        />
        <span className="text-sm text-muted-foreground">평</span>
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
          <ClipboardList className="h-12 w-12 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            현재 입찰 가능한 경매가 없습니다
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {auctions.map((auction) => (
            <OpenAuctionCard
              key={auction.id}
              auction={auction}
              onClick={() =>
                router.push(`/bids/${auction.id}/submit`)
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

function OpenAuctionCard({
  auction,
  onClick,
}: {
  auction: OpenAuctionItem;
  onClick: () => void;
}) {
  const budgetText =
    auction.budget_min && auction.budget_max
      ? `${auction.budget_min.toLocaleString()}~${auction.budget_max.toLocaleString()}만원`
      : auction.budget_min
        ? `${auction.budget_min.toLocaleString()}만원~`
        : auction.budget_max
          ? `~${auction.budget_max.toLocaleString()}만원`
          : null;

  const timeRemaining = auction.deadline_at
    ? getTimeRemaining(auction.deadline_at)
    : null;

  return (
    <Card
      className="cursor-pointer transition-colors hover:bg-accent/30"
      onClick={onClick}
    >
      <CardContent className="flex flex-col gap-2 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">{auction.title}</h3>
          {auction.my_bid_status !== null ? (
            <span className="shrink-0 rounded-full bg-safe/10 px-2 py-0.5 text-[10px] font-medium text-safe">
              입찰 완료
            </span>
          ) : (
            <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
              입찰 가능
            </span>
          )}
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
          {timeRemaining && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {timeRemaining}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function getTimeRemaining(deadlineStr: string): string {
  const diff = new Date(deadlineStr).getTime() - Date.now();
  if (diff <= 0) return "마감";
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 24) return `${hours}시간 남음`;
  const days = Math.floor(hours / 24);
  return `${days}일 남음`;
}
