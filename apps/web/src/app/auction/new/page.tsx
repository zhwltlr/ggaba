"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Input } from "@ggaba/ui";
import { useToast } from "@ggaba/ui";
import { cn } from "@ggaba/lib/utils";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
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

const TOTAL_STEPS = 5;

const STEP_TITLES = [
  "시공 지역을 선택해주세요",
  "평수를 입력해주세요",
  "예산 범위를 알려주세요",
  "희망 시공 일정을 알려주세요",
  "상세 내용을 작성해주세요",
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

  const [step, setStep] = useState(0);
  const [selectedRegion, setSelectedRegion] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<AuctionForm>({
    resolver: zodResolver(auctionSchema),
  });

  const canGoNext = useCallback(() => {
    switch (step) {
      case 0:
        return !!selectedRegion;
      case 1:
        return !!getValues("sizePyeong") && Number(getValues("sizePyeong")) >= 1;
      case 2: // 예산은 선택사항
      case 3: // 일정은 선택사항
        return true;
      case 4:
        return !!getValues("title")?.trim();
      default:
        return false;
    }
  }, [step, selectedRegion, getValues]);

  const handleNext = () => {
    if (step < TOTAL_STEPS - 1 && canGoNext()) {
      setStep(step + 1);
    }
  };

  const handlePrev = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const onSubmit = useCallback(
    async (formData: AuctionForm) => {
      if (!selectedRegion) {
        toast({
          title: "지역을 선택해주세요",
          variant: "destructive",
        });
        setStep(0);
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
          onClick={() => (step > 0 ? handlePrev() : router.back())}
          className="rounded-full p-1 hover:bg-muted"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold">시공 요청하기</h1>
      </div>

      {/* 스텝 인디케이터 */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-1.5">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors",
                i <= step ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          {step + 1}/{TOTAL_STEPS}
        </p>
      </div>

      {/* 스텝 제목 */}
      <h2 className="text-base font-semibold">{STEP_TITLES[step]}</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {/* Step 1: 지역 선택 */}
        {step === 0 && (
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
        )}

        {/* Step 2: 평수 */}
        {step === 1 && (
          <div className="flex flex-col gap-1.5">
            <Input
              type="number"
              placeholder="예: 24"
              {...register("sizePyeong")}
              autoFocus
            />
            {errors.sizePyeong && (
              <p className="text-xs text-destructive">
                {errors.sizePyeong.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              시공할 공간의 평수를 입력해주세요
            </p>
          </div>
        )}

        {/* Step 3: 예산 범위 */}
        {step === 2 && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder="최소 (만원)"
                {...register("budgetMin")}
                autoFocus
              />
              <span className="text-sm text-muted-foreground">~</span>
              <Input
                type="number"
                placeholder="최대 (만원)"
                {...register("budgetMax")}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              미입력 시 &quot;예산 협의&quot;로 표시됩니다
            </p>
          </div>
        )}

        {/* Step 4: 시공 일정 */}
        {step === 3 && (
          <div className="flex flex-col gap-1.5">
            <Input
              placeholder="예: 2026년 3월 중, 즉시 가능"
              {...register("schedule")}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              미입력 시 &quot;일정 협의&quot;로 표시됩니다
            </p>
          </div>
        )}

        {/* Step 5: 제목 + 상세 설명 */}
        {step === 4 && (
          <>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">제목</label>
              <Input
                placeholder="예: 24평 아파트 욕실+주방 리모델링"
                {...register("title")}
                autoFocus
              />
              {errors.title && (
                <p className="text-xs text-destructive">
                  {errors.title.message}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">상세 설명</label>
              <textarea
                placeholder="시공 요구사항을 자세히 적어주세요"
                rows={6}
                {...register("description")}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            {/* TODO: 사진 업로드 — Storage 버킷 설정 필요 */}
          </>
        )}

        {/* 네비게이션 버튼 */}
        <div className="flex gap-3 pt-2">
          {step > 0 && (
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={handlePrev}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              이전
            </Button>
          )}
          {step < TOTAL_STEPS - 1 ? (
            <Button
              type="button"
              className="flex-1"
              disabled={!canGoNext()}
              onClick={handleNext}
            >
              다음
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? "등록 중..." : "시공 요청 등록"}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
