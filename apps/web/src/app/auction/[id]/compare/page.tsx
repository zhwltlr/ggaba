"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Button,
  Card,
  CardContent,
  Skeleton,
} from "@ggaba/ui";
import { useToast } from "@ggaba/ui";
import { cn } from "@ggaba/lib/utils";
import { ArrowLeft, Check, User } from "lucide-react";
import { getBidsForAuction } from "@/app/auction/_actions/bids-compare";
import { selectBid } from "@/app/auction/_actions/auctions";
import type { BidItem, AuctionStatus } from "@/app/auction/_types";
import { useAuth } from "@/hooks/use-auth";
import { ReportDialog } from "@/app/_components/report-dialog";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function getPriceColor(
  price: number,
  minPrice: number,
  maxPrice: number
): string {
  if (minPrice === maxPrice) return "text-foreground";
  if (price === minPrice) return "text-safe";
  if (price === maxPrice) return "text-danger";
  return "text-muted-foreground";
}

function getPriceBg(
  price: number,
  minPrice: number,
  maxPrice: number
): string {
  if (minPrice === maxPrice) return "";
  if (price === minPrice) return "bg-safe/5 border-safe/30";
  if (price === maxPrice) return "bg-danger/5 border-danger/30";
  return "";
}

export default function BidComparePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const auctionId = params.id as string;

  const [bids, setBids] = useState<BidItem[]>([]);
  const [auctionStatus, setAuctionStatus] = useState<AuctionStatus>("open");
  const [loading, setLoading] = useState(true);
  const [confirmingBidId, setConfirmingBidId] = useState<string | null>(null);
  const [selecting, setSelecting] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    getBidsForAuction(auctionId).then((res) => {
      if (res.error) {
        toast({
          title: "오류",
          description: res.error,
          variant: "destructive",
        });
        router.back();
        return;
      }
      setBids(res.bids);
      if (res.auctionStatus) {
        setAuctionStatus(res.auctionStatus as AuctionStatus);
      }
      setLoading(false);
    });
  }, [auctionId, toast, router]);

  const { minPrice, maxPrice } = useMemo(() => {
    if (bids.length === 0) return { minPrice: 0, maxPrice: 0 };
    const prices = bids.map((b) => b.total_price);
    return { minPrice: Math.min(...prices), maxPrice: Math.max(...prices) };
  }, [bids]);

  const canSelect = auctionStatus === "open" || auctionStatus === "bidding";

  const handleSelectBid = async (bidId: string) => {
    setSelecting(true);
    const result = await selectBid({ auctionId, bidId });
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
      } else {
        router.push(`/auction/${auctionId}`);
      }
    }
    setSelecting(false);
    setConfirmingBidId(null);
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

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
        <h1 className="text-lg font-bold">입찰 비교</h1>
        <span className="text-xs text-muted-foreground">
          {bids.length}건
        </span>
      </div>

      {/* 비교 범례 */}
      {bids.length >= 2 && (
        <div className="flex items-center gap-4 text-[10px]">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-safe" />
            최저가
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-danger" />
            최고가
          </span>
        </div>
      )}

      {/* 비교 테이블 */}
      <div className="flex flex-col gap-3">
        {bids.map((bid, index) => {
          const priceColor = getPriceColor(bid.total_price, minPrice, maxPrice);
          const priceBg = getPriceBg(bid.total_price, minPrice, maxPrice);
          const bidBadgeClass =
            bid.status === "selected"
              ? "bg-safe/10 text-safe"
              : bid.status === "rejected"
                ? "bg-muted text-muted-foreground"
                : "bg-primary/10 text-primary";
          const bidBadgeLabel =
            bid.status === "selected"
              ? "선택됨"
              : bid.status === "rejected"
                ? "미선택"
                : "제출됨";

          return (
            <Card
              key={bid.id}
              className={cn(
                "transition-colors",
                priceBg,
                bid.status === "selected" && "border-safe/50",
                bid.status === "rejected" && "opacity-60"
              )}
            >
              <CardContent className="flex flex-col gap-3 p-4">
                {/* 레이블 + 상태 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {ALPHABET[index]}
                    </div>
                    <span className="text-sm font-semibold">
                      입찰 {ALPHABET[index]}
                    </span>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-medium",
                      bidBadgeClass
                    )}
                  >
                    {bidBadgeLabel}
                  </span>
                </div>

                {/* 총액 */}
                <div className="flex items-baseline justify-between">
                  <span className={cn("text-xl font-bold", priceColor)}>
                    {bid.total_price.toLocaleString()}
                    <span className="text-sm font-normal text-muted-foreground">
                      원
                    </span>
                  </span>
                  {bid.total_price === minPrice && bids.length >= 2 && (
                    <span className="text-[10px] font-medium text-safe">
                      최저가
                    </span>
                  )}
                  {bid.total_price === maxPrice &&
                    minPrice !== maxPrice && (
                      <span className="text-[10px] font-medium text-danger">
                        최고가
                      </span>
                    )}
                </div>

                {/* 메시지 */}
                {bid.message && (
                  <p className="whitespace-pre-wrap rounded-md bg-accent/30 p-2.5 text-xs leading-relaxed">
                    {bid.message}
                  </p>
                )}

                {/* 제출일 + 신고 */}
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-muted-foreground">
                    제출일: {new Date(bid.created_at).toLocaleDateString("ko-KR")}
                  </p>
                  {user && user.id !== bid.contractor_id && (
                    <ReportDialog targetType="bid" targetId={bid.id} />
                  )}
                </div>

                {/* 시공사 프로필 링크 (선택된 입찰만) */}
                {bid.status === "selected" && bid.contractor_id && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      router.push(`/contractor/${bid.contractor_id}`)
                    }
                  >
                    <User className="mr-1 h-3.5 w-3.5" />
                    시공사 프로필 보기
                  </Button>
                )}

                {/* 선택 버튼 */}
                {canSelect && bid.status === "submitted" && (
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
                            disabled={selecting}
                            onClick={() => handleSelectBid(bid.id)}
                          >
                            <Check className="mr-1 h-3.5 w-3.5" />
                            {selecting ? "처리 중..." : "확인"}
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
        })}
      </div>
    </div>
  );
}
