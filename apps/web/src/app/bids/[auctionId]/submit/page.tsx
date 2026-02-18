"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Skeleton,
} from "@ggaba/ui";
import { useToast } from "@ggaba/ui";
import { cn } from "@ggaba/lib/utils";
import {
  ArrowLeft,
  MapPin,
  Ruler,
  Wallet,
  Calendar,
  Plus,
  Trash2,
} from "lucide-react";
import { useOpenAuctionDetail, useSubmitBid } from "@/hooks/use-bid";
import type { BidItemInput } from "@/app/bids/_types";

const CATEGORIES = [
  "철거", "욕실", "주방", "거실", "침실",
  "도배", "바닥", "전기", "설비", "방수", "기타",
];

const UNITS = ["m²", "ea", "식", "m", "개소", "회"];

function createEmptyItem(): BidItemInput & { _key: number } {
  return {
    _key: Date.now() + Math.random(),
    category: CATEGORIES[0],
    detail: "",
    unit: UNITS[0],
    unitPrice: 0,
    quantity: 1,
  };
}

export default function BidSubmitPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const auctionId = params.auctionId as string;

  const { data, isLoading } = useOpenAuctionDetail(auctionId);
  const submitBid = useSubmitBid();

  const [items, setItems] = useState<(BidItemInput & { _key: number })[]>([
    createEmptyItem(),
  ]);
  const [message, setMessage] = useState("");

  const auction = data?.auction;
  const myBidStatus = data?.myBidStatus;
  const alreadyBid = myBidStatus !== null && myBidStatus !== undefined;

  const totalPrice = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + Math.round(item.unitPrice * item.quantity),
        0
      ),
    [items]
  );

  const updateItem = (
    index: number,
    field: keyof BidItemInput,
    value: string | number
  ) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const addItem = () => {
    setItems((prev) => [...prev, createEmptyItem()]);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    // 기본 검증
    const invalidItems = items.filter(
      (item) => !item.detail || item.unitPrice <= 0 || item.quantity <= 0
    );
    if (invalidItems.length > 0) {
      toast({
        title: "입력 오류",
        description: "모든 항목의 세부항목, 단가, 수량을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    const result = await submitBid.mutateAsync({
      auctionId,
      totalPrice,
      message: message.trim() || undefined,
      items: items.map(({ _key, ...rest }) => rest),
    });

    if (result.error) {
      toast({
        title: "입찰 실패",
        description: result.error,
        variant: "destructive",
      });
    } else {
      toast({ title: "입찰이 제출되었습니다!" });
      router.push("/bids/my");
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-60 w-full" />
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="flex flex-col items-center gap-3 p-4 py-20 text-center">
        <p className="text-sm text-muted-foreground">
          경매를 찾을 수 없습니다
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/bids")}
        >
          목록으로
        </Button>
      </div>
    );
  }

  const budgetText =
    auction.budget_min && auction.budget_max
      ? `${auction.budget_min.toLocaleString()}~${auction.budget_max.toLocaleString()}만원`
      : auction.budget_min
        ? `${auction.budget_min.toLocaleString()}만원~`
        : auction.budget_max
          ? `~${auction.budget_max.toLocaleString()}만원`
          : "미정";

  return (
    <div className="flex flex-col gap-4 p-4 pb-8">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-full p-1 hover:bg-muted"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="flex-1 text-lg font-bold">입찰하기</h1>
      </div>

      {/* 경매 요약 정보 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">시공 요청 정보</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold">{auction.title}</h3>
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
        </CardContent>
      </Card>

      {/* 이미 입찰한 경우 */}
      {alreadyBid ? (
        <Card className="border-safe/30 bg-safe/5">
          <CardContent className="py-8 text-center">
            <p className="text-sm font-medium text-safe">
              이미 입찰하셨습니다
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              이 경매에 대한 입찰을 수정할 수 없습니다
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => router.push("/bids/my")}
            >
              내 입찰 내역 보기
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* 입찰 항목 폼 */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">입찰 항목</CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addItem}
                >
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  항목 추가
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {items.map((item, index) => (
                <div
                  key={item._key}
                  className="flex flex-col gap-2 rounded-lg border p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">
                      항목 {index + 1}
                    </span>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-danger"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {/* 카테고리 + 세부항목 */}
                  <div className="flex gap-2">
                    <select
                      value={item.category}
                      onChange={(e) =>
                        updateItem(index, "category", e.target.value)
                      }
                      className={cn(
                        "h-9 w-24 shrink-0 rounded-md border bg-background px-2 text-sm",
                        "focus:outline-none focus:ring-2 focus:ring-ring"
                      )}
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <Input
                      placeholder="세부항목 (예: 타일시공)"
                      className="h-9 text-sm"
                      value={item.detail}
                      onChange={(e) =>
                        updateItem(index, "detail", e.target.value)
                      }
                    />
                  </div>

                  {/* 단위 + 단가 + 수량 */}
                  <div className="flex items-center gap-2">
                    <select
                      value={item.unit}
                      onChange={(e) =>
                        updateItem(index, "unit", e.target.value)
                      }
                      className={cn(
                        "h-9 w-20 shrink-0 rounded-md border bg-background px-2 text-sm",
                        "focus:outline-none focus:ring-2 focus:ring-ring"
                      )}
                    >
                      {UNITS.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                    <Input
                      type="number"
                      placeholder="단가"
                      className="h-9 text-sm"
                      value={item.unitPrice || ""}
                      onChange={(e) =>
                        updateItem(
                          index,
                          "unitPrice",
                          Number(e.target.value) || 0
                        )
                      }
                    />
                    <span className="text-xs text-muted-foreground">×</span>
                    <Input
                      type="number"
                      placeholder="수량"
                      className="h-9 w-20 shrink-0 text-sm"
                      value={item.quantity || ""}
                      onChange={(e) =>
                        updateItem(
                          index,
                          "quantity",
                          Number(e.target.value) || 0
                        )
                      }
                    />
                  </div>

                  {/* 소계 */}
                  <div className="text-right text-xs text-muted-foreground">
                    소계:{" "}
                    <span className="font-medium text-foreground">
                      {Math.round(
                        item.unitPrice * item.quantity
                      ).toLocaleString()}
                      원
                    </span>
                  </div>
                </div>
              ))}

              {/* 총합계 */}
              <div className="flex items-center justify-between rounded-lg bg-primary/5 p-3">
                <span className="text-sm font-medium">총 입찰 금액</span>
                <span className="text-lg font-bold">
                  {totalPrice.toLocaleString()}
                  <span className="text-sm font-normal text-muted-foreground">
                    원
                  </span>
                </span>
              </div>
            </CardContent>
          </Card>

          {/* 시공사 코멘트 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">코멘트 (선택)</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                placeholder="시공 경험, 강점 등을 자유롭게 작성해주세요"
                className={cn(
                  "w-full rounded-md border bg-background px-3 py-2 text-sm",
                  "min-h-[80px] resize-none",
                  "focus:outline-none focus:ring-2 focus:ring-ring"
                )}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </CardContent>
          </Card>

          {/* 제출 버튼 */}
          <Button
            className="w-full"
            size="lg"
            disabled={submitBid.isPending || totalPrice <= 0}
            onClick={handleSubmit}
          >
            {submitBid.isPending ? "제출 중..." : "입찰 제출하기"}
          </Button>
        </>
      )}
    </div>
  );
}
