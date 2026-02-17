"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  BagajiScore,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@ggaba/ui";
import { useToast } from "@ggaba/ui";
import { AlertTriangle, Share2, FolderOpen, RotateCcw } from "lucide-react";
import { cn } from "@ggaba/lib/utils";
import { formatCurrency } from "@ggaba/lib/utils/format";
import { useDiagnosisStore } from "@/stores/use-diagnosis-store";
import { submitDiagnosis } from "@/app/diagnosis/_actions/submit";
import { getPriceRating, calculateBadPriceScore } from "@/lib/mock-ocr";

const RATING_STYLES: Record<string, string> = {
  적정: "text-safe",
  주의: "text-warning",
  과다: "text-danger font-semibold",
  저가: "text-blue-500",
};

export function StepResult() {
  const router = useRouter();
  const { toast } = useToast();
  const { extractedData, userInput, masking, uploadedImages, reset, setEstimateId } =
    useDiagnosisStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{
    estimateId: string;
    badPriceScore: number;
    totalPrice: number;
    warnings: string[];
  } | null>(null);

  // 로컬 분석 (제출 전 미리보기)
  const badPriceScore = calculateBadPriceScore(extractedData);
  const totalPrice = extractedData.reduce((s, i) => s + i.totalPrice, 0);

  const analyzedItems = extractedData.map((item) => {
    const { rating, low, high } = getPriceRating(
      item.category,
      item.detail,
      item.unitPrice
    );
    return { ...item, priceRating: rating, marketPriceLow: low, marketPriceHigh: high };
  });

  // 경고 생성
  const warnings: string[] = [];
  analyzedItems.forEach((item) => {
    if (item.priceRating === "과다" || item.priceRating === "주의") {
      const diff = Math.round(
        ((item.unitPrice - item.marketPriceHigh) / item.marketPriceHigh) * 100
      );
      if (diff > 0) {
        warnings.push(
          `${item.category} - ${item.detail}: 시세 대비 ${diff}% 높음`
        );
      }
    }
  });

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    try {
      const res = await submitDiagnosis({
        items: extractedData,
        userInput,
        masking,
        imageUrls: uploadedImages.map((img) => img.url),
      });

      if (res.error) {
        toast({
          title: "진단 저장 실패",
          description: res.error,
          variant: "destructive",
        });
        return;
      }

      if (res.estimateId) {
        setEstimateId(res.estimateId);
        setResult({
          estimateId: res.estimateId,
          badPriceScore: res.badPriceScore!,
          totalPrice: res.totalPrice!,
          warnings: res.warnings!,
        });
        toast({ title: "진단이 완료되었습니다!", variant: "default" });
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [extractedData, userInput, masking, uploadedImages, setEstimateId, toast]);

  const score = result?.badPriceScore ?? badPriceScore;
  const total = result?.totalPrice ?? totalPrice;
  const displayWarnings = result?.warnings ?? warnings;

  return (
    <div className="flex flex-col gap-4">
      {/* 바가지 점수 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">바가지 점수</CardTitle>
        </CardHeader>
        <CardContent>
          <BagajiScore score={score} size="lg" />
        </CardContent>
      </Card>

      {/* 요약 */}
      <Card>
        <CardContent className="flex flex-col gap-2 p-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">전체 합계</span>
            <span className="font-bold">{formatCurrency(total)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">항목 수</span>
            <span className="font-medium">{extractedData.length}개</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">지역</span>
            <span>{userInput.region || "-"}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">평수</span>
            <span>{userInput.sizePyeong ? `${userInput.sizePyeong}평` : "-"}</span>
          </div>
        </CardContent>
      </Card>

      {/* 경고 알림 */}
      {displayWarnings.length > 0 && (
        <Card className="border-warning/50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-warning">
              <AlertTriangle className="h-4 w-4" />
              주의 사항
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1.5">
            {displayWarnings.map((w, i) => (
              <p key={i} className="text-xs text-muted-foreground">
                • {w}
              </p>
            ))}
          </CardContent>
        </Card>
      )}

      {/* 항목별 분석 테이블 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">항목별 분석</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[80px]">항목</TableHead>
                  <TableHead className="w-20 text-right">단가</TableHead>
                  <TableHead className="w-28 text-right">시세 범위</TableHead>
                  <TableHead className="w-14 text-center">판정</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analyzedItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-xs">
                      <div>{item.detail}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {item.category}
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-xs">
                      {formatCurrency(item.unitPrice)}
                    </TableCell>
                    <TableCell className="text-right text-[10px] text-muted-foreground">
                      {formatCurrency(item.marketPriceLow)}~
                      {formatCurrency(item.marketPriceHigh)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-center text-xs font-medium",
                        RATING_STYLES[item.priceRating]
                      )}
                    >
                      {item.priceRating}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* 액션 버튼 */}
      <div className="flex flex-col gap-2">
        {!result && (
          <Button
            size="lg"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? "저장 중..." : "진단 결과 저장하기"}
          </Button>
        )}
        {result && (
          <>
            <Button
              variant="outline"
              onClick={() => router.push(`/diagnosis/result/${result.estimateId}`)}
              className="w-full"
            >
              <FolderOpen className="mr-2 h-4 w-4" />
              상세 결과 보기
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                toast({ title: "커뮤니티 공유 기능은 Phase 3에서 구현됩니다" });
              }}
              className="w-full"
            >
              <Share2 className="mr-2 h-4 w-4" />
              커뮤니티에 공유
            </Button>
          </>
        )}
        <Button
          variant="ghost"
          onClick={() => {
            reset();
            router.push("/diagnosis");
          }}
          className="w-full"
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          새로 진단하기
        </Button>
      </div>
    </div>
  );
}
