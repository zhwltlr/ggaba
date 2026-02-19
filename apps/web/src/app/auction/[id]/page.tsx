"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
} from "@ggaba/ui";
import { useToast } from "@ggaba/ui";
import { cn } from "@ggaba/lib/utils";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Ruler,
  Wallet,
  Clock,
  BarChart3,
} from "lucide-react";
import { useAuctionDetail, useSelectBid } from "@/hooks/use-auction";
import type { AuctionStatus, BidItem } from "@/app/auction/_types";

const STATUS_BADGE: Record<AuctionStatus, { label: string; className: string }> = {
  open: { label: "입찰 대기", className: "bg-primary/10 text-primary" },
  bidding: { label: "입찰 중", className: "bg-warning/10 text-warning" },
  selected: { label: "선택됨", className: "bg-safe/10 text-safe" },
  in_progress: { label: "시공 중", className: "bg-info/10 text-info" },
  completed: { label: "완료", className: "bg-muted text-muted-foreground" },
  cancelled: { label: "취소", className: "bg-danger/10 text-danger" },
};

const BID_STATUS_BADGE: Record<
  BidItem["status"],
  { label: string; className: string }
> = {
  submitted: { label: "제출됨", className: "bg-primary/10 text-primary" },
  selected: { label: "선택됨", className: "bg-safe/10 text-safe" },
  rejected: { label: "미선택", className: "bg-muted text-muted-foreground" },
};

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function useCountdown(deadline: string | null) {
  const [remaining, setRemaining] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    expired: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: true });

  useEffect(() => {
    if (!deadline) return;

    const calc = () => {
      const diff = new Date(deadline).getTime() - Date.now();
      if (diff <= 0) {
        setRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: true });
        return;
      }
      setRemaining({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
        expired: false,
      });
    };

    calc();
    const interval = setInterval(calc, 1000);
    return () => clearInterval(interval);
  }, [deadline]);

  return remaining;
}

export default function AuctionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const id = params.id as string;

  const { data, isLoading } = useAuctionDetail(id, { refetchInterval: 30_000 });
  const selectBidMutation = useSelectBid(id);

  const [confirmingBidId, setConfirmingBidId] = useState<string | null>(null);

  const auction = data?.auction;

  const countdown = useCountdown(auction?.deadline_at ?? null);
  const isBeforeDeadline = auction?.deadline_at && !countdown.expired;
  const isActive = auction?.status === "open" || auction?.status === "bidding";

  const handleSelectBid = async (bidId: string) => {
    const result = await selectBidMutation.mutateAsync(bidId);
    if (result.error) {
      toast({
        title: "입찰 선택 실패",
        description: result.error,
        variant: "destructive",
      });
    } else {
      toast({ title: "입찰을 선택했습니다! 채팅방으로 이동합니다." });
      if (result.chatRoomId) {
        router.push(`/chat/${result.chatRoomId}`);
      }
    }
    setConfirmingBidId(null);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="flex flex-col items-center gap-3 p-4 py-20 text-center">
        <p className="text-sm text-muted-foreground">
          경매를 찾을 수 없습니다
        </p>
        <Button variant="outline" size="sm" onClick={() => router.push("/auction")}>
          목록으로
        </Button>
      </div>
    );
  }

  const badge = STATUS_BADGE[auction.status];
  const canSelectBid =
    auction.status === "open" || auction.status === "bidding";

  const budgetText =
    auction.budget_min && auction.budget_max
      ? `${auction.budget_min.toLocaleString()}~${auction.budget_max.toLocaleString()}만원`
      : auction.budget_min
        ? `${auction.budget_min.toLocaleString()}만원~`
        : auction.budget_max
          ? `~${auction.budget_max.toLocaleString()}만원`
          : "미정";

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-full p-1 hover:bg-muted"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="flex-1 text-lg font-bold">{auction.title}</h1>
        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-1 text-xs font-medium",
            badge.className
          )}
        >
          {badge.label}
        </span>
      </div>

      {/* 입찰 진행 중 배너 + 카운트다운 */}
      {isActive && isBeforeDeadline && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex items-center gap-3 p-3">
            <Clock className="h-5 w-5 shrink-0 text-primary" />
            <div className="flex-1">
              <p className="text-xs font-medium text-primary">입찰 진행 중</p>
              <p className="mt-0.5 text-sm font-bold tabular-nums">
                {countdown.days > 0 && `${countdown.days}일 `}
                {String(countdown.hours).padStart(2, "0")}:
                {String(countdown.minutes).padStart(2, "0")}:
                {String(countdown.seconds).padStart(2, "0")}
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  남음
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {isActive && countdown.expired && auction.deadline_at && (
        <Card className="border-muted bg-muted/30">
          <CardContent className="flex items-center gap-3 p-3">
            <Clock className="h-5 w-5 shrink-0 text-muted-foreground" />
            <p className="text-xs font-medium text-muted-foreground">
              입찰 마감 시간이 지났습니다
            </p>
          </CardContent>
        </Card>
      )}

      {/* 경매 정보 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">시공 요청 정보</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-[10px] text-muted-foreground">지역</p>
                <p className="text-sm font-medium">{auction.region}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Ruler className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-[10px] text-muted-foreground">평수</p>
                <p className="text-sm font-medium">{auction.size_pyeong}평</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-[10px] text-muted-foreground">예산</p>
                <p className="text-sm font-medium">{budgetText}</p>
              </div>
            </div>
            {auction.schedule && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-[10px] text-muted-foreground">일정</p>
                  <p className="text-sm font-medium">{auction.schedule}</p>
                </div>
              </div>
            )}
          </div>

          {auction.description && (
            <div className="rounded-md bg-accent/30 p-3">
              <p className="whitespace-pre-wrap text-xs leading-relaxed">
                {auction.description}
              </p>
            </div>
          )}

          <p className="text-[10px] text-muted-foreground">
            등록일:{" "}
            {new Date(auction.created_at).toLocaleDateString("ko-KR")}
            {auction.deadline_at && (
              <>
                {" · "}마감:{" "}
                {new Date(auction.deadline_at).toLocaleDateString("ko-KR")}
              </>
            )}
          </p>
        </CardContent>
      </Card>

      {/* 입찰 비교 */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold">
            입찰 현황 ({auction.bids.length}건)
          </h2>
          {auction.bids.length >= 2 && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/auction/${id}/compare`}>
                <BarChart3 className="mr-1 h-3.5 w-3.5" />
                입찰 비교하기
              </Link>
            </Button>
          )}
        </div>

        {auction.bids.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-sm text-muted-foreground">
                아직 입찰이 없습니다
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                시공사의 입찰을 기다려주세요
              </p>
            </CardContent>
          </Card>
        ) : (
          auction.bids.map((bid, index) => {
            const bidBadge = BID_STATUS_BADGE[bid.status];
            const isSelected = bid.status === "selected";
            const isRejected = bid.status === "rejected";

            return (
              <Card
                key={bid.id}
                className={cn(
                  "transition-colors",
                  isSelected && "border-safe/50 bg-safe/5",
                  isRejected && "opacity-60"
                )}
              >
                <CardContent className="flex flex-col gap-3 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {ALPHABET[index]}
                      </div>
                      <span className="text-sm font-semibold">
                        입찰 {ALPHABET[index]}
                      </span>
                    </div>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-medium",
                        bidBadge.className
                      )}
                    >
                      {bidBadge.label}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between">
                    <span className="text-lg font-bold">
                      {bid.total_price.toLocaleString()}
                      <span className="text-sm font-normal text-muted-foreground">
                        원
                      </span>
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(bid.created_at).toLocaleDateString("ko-KR")}
                    </span>
                  </div>

                  {bid.message && (
                    <p className="whitespace-pre-wrap rounded-md bg-accent/30 p-2.5 text-xs leading-relaxed">
                      {bid.message}
                    </p>
                  )}

                  {/* 선택 버튼 */}
                  {canSelectBid && bid.status === "submitted" && (
                    <>
                      {confirmingBidId === bid.id ? (
                        <div className="flex flex-col gap-2 rounded-md border border-warning/30 bg-warning/5 p-3">
                          <p className="text-xs font-medium">
                            이 입찰을 선택하시겠습니까?
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            선택 후에는 변경할 수 없습니다
                          </p>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="flex-1"
                              disabled={selectBidMutation.isPending}
                              onClick={() => handleSelectBid(bid.id)}
                            >
                              {selectBidMutation.isPending
                                ? "처리 중..."
                                : "확인"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              onClick={() => setConfirmingBidId(null)}
                            >
                              취소
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setConfirmingBidId(bid.id)}
                        >
                          이 입찰 선택
                        </Button>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
