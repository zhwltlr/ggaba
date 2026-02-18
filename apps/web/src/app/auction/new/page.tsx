"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Input } from "@ggaba/ui";
import { useToast } from "@ggaba/ui";
import { cn } from "@ggaba/lib/utils";
import { ArrowLeft } from "lucide-react";
import { createAuction } from "@/app/auction/_actions/auctions";

const REGIONS = [
  "서울",
  "경기",
  "인천",
  "부산",
  "대구",
  "광주",
  "대전",
  "울산",
  "세종",
  "강원",
  "충북",
  "충남",
  "전북",
  "전남",
  "경북",
  "경남",
  "제주",
];

const auctionSchema = z.object({
  title: z.string().min(1, "제목을 입력해주세요").max(200),
  sizePyeong: z.coerce.number().min(1, "평수를 입력해주세요"),
  budgetMin: z.coerce.number().optional(),
  budgetMax: z.coerce.number().optional(),
  schedule: z.string().max(100).optional(),
  description: z.string().max(5000).optional(),
});

type AuctionForm = z.infer<typeof auctionSchema>;

export default function AuctionNewPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [selectedRegion, setSelectedRegion] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AuctionForm>({
    resolver: zodResolver(auctionSchema),
  });

  const onSubmit = useCallback(
    async (formData: AuctionForm) => {
      if (!selectedRegion) {
        toast({
          title: "지역을 선택해주세요",
          variant: "destructive",
        });
        return;
      }

      setIsSubmitting(true);
      try {
        const result = await createAuction({
          title: formData.title,
          region: selectedRegion,
          sizePyeong: formData.sizePyeong,
          budgetMin: formData.budgetMin,
          budgetMax: formData.budgetMax,
          schedule: formData.schedule,
          description: formData.description,
        });

        if (result.error) {
          toast({
            title: "경매 생성 실패",
            description: result.error,
            variant: "destructive",
          });
          return;
        }

        toast({ title: "시공 요청이 등록되었습니다!" });
        router.push(`/auction/${result.auctionId}`);
      } finally {
        setIsSubmitting(false);
      }
    },
    [selectedRegion, toast, router]
  );

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
        <h1 className="text-lg font-bold">시공 요청하기</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {/* 제목 */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">제목</label>
          <Input
            placeholder="예: 24평 아파트 욕실+주방 리모델링"
            {...register("title")}
          />
          {errors.title && (
            <p className="text-xs text-destructive">{errors.title.message}</p>
          )}
        </div>

        {/* 지역 */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">지역</label>
          <div className="flex flex-wrap gap-2">
            {REGIONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setSelectedRegion(r)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                  selectedRegion === r
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {r}
              </button>
            ))}
          </div>
          {!selectedRegion && (
            <p className="text-xs text-muted-foreground">
              시공 지역을 선택해주세요
            </p>
          )}
        </div>

        {/* 평수 */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">평수</label>
          <Input
            type="number"
            placeholder="예: 24"
            {...register("sizePyeong")}
          />
          {errors.sizePyeong && (
            <p className="text-xs text-destructive">
              {errors.sizePyeong.message}
            </p>
          )}
        </div>

        {/* 예산 범위 */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">예산 범위 (만원)</label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder="최소"
              {...register("budgetMin")}
            />
            <span className="text-sm text-muted-foreground">~</span>
            <Input
              type="number"
              placeholder="최대"
              {...register("budgetMax")}
            />
          </div>
        </div>

        {/* 일정 */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">희망 일정</label>
          <Input
            placeholder="예: 2026년 3월 중, 즉시 가능"
            {...register("schedule")}
          />
        </div>

        {/* 설명 */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">상세 설명</label>
          <textarea
            placeholder="시공 요구사항을 자세히 적어주세요"
            rows={6}
            {...register("description")}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting}
          className="w-full"
        >
          {isSubmitting ? "등록 중..." : "시공 요청 등록"}
        </Button>
      </form>
    </div>
  );
}
