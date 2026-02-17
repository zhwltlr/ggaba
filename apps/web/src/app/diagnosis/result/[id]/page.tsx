"use client";

import { useParams, useRouter } from "next/navigation";
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
  Skeleton,
} from "@ggaba/ui";
import { AlertTriangle, ArrowLeft, Share2, RotateCcw } from "lucide-react";
import { cn } from "@ggaba/lib/utils";
import { formatCurrency } from "@ggaba/lib/utils/format";
import { useEstimateDetail } from "@/hooks/use-estimate";

const RATING_STYLES: Record<string, string> = {
  적정: "text-safe",
  주의: "text-warning",
  과다: "text-danger font-semibold",
  저가: "text-blue-500",
};

export default function DiagnosisResultPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data, isLoading, error } = useEstimateDetail(id);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center gap-4 p-8 text-center">
        <p className="text-sm text-muted-foreground">
          견적 정보를 불러올 수 없습니다.
        </p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          돌아가기
        </Button>
      </div>
    );
  }

  const { estimate, items } = data;
  const diagnosisResult = estimate.diagnosis_result
    ? JSON.parse(estimate.diagnosis_result)
    : null;
  const warnings: string[] = diagnosisResult?.warnings ?? [];

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
        <h1 className="text-lg font-bold">{estimate.title}</h1>
      </div>

      {/* 바가지 점수 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">바가지 점수</CardTitle>
        </CardHeader>
        <CardContent>
          <BagajiScore score={estimate.bad_price_score ?? 0} size="lg" />
        </CardContent>
      </Card>

      {/* 요약 */}
      <Card>
        <CardContent className="flex flex-col gap-2 p-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">전체 합계</span>
            <span className="font-bold">
              {formatCurrency(estimate.total_price ?? 0)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">항목 수</span>
            <span className="font-medium">{items.length}개</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">지역</span>
            <span>{estimate.region || "-"}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">평수</span>
            <span>
              {estimate.size_pyeong ? `${estimate.size_pyeong}평` : "-"}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">건물 유형</span>
            <span>{estimate.building_type || "-"}</span>
          </div>
        </CardContent>
      </Card>

      {/* 경고 */}
      {warnings.length > 0 && (
        <Card className="border-warning/50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-warning">
              <AlertTriangle className="h-4 w-4" />
              주의 사항
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1.5">
            {warnings.map((w: string, i: number) => (
              <p key={i} className="text-xs text-muted-foreground">
                • {w}
              </p>
            ))}
          </CardContent>
        </Card>
      )}

      {/* 항목별 분석 */}
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
                {items.map((item: Record<string, unknown>) => (
                  <TableRow key={item.id as string}>
                    <TableCell className="text-xs">
                      <div>{item.detail as string}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {item.category as string}
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-xs">
                      {formatCurrency((item.unit_price as number) ?? 0)}
                    </TableCell>
                    <TableCell className="text-right text-[10px] text-muted-foreground">
                      {item.market_price_low && item.market_price_high
                        ? `${formatCurrency(item.market_price_low as number)}~${formatCurrency(item.market_price_high as number)}`
                        : "-"}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-center text-xs font-medium",
                        RATING_STYLES[(item.price_rating as string) ?? ""] ?? ""
                      )}
                    >
                      {(item.price_rating as string) || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* 액션 */}
      <div className="flex flex-col gap-2">
        <Button
          variant="outline"
          onClick={() => {
            // Phase 3에서 구현
          }}
          className="w-full"
        >
          <Share2 className="mr-2 h-4 w-4" />
          커뮤니티에 공유
        </Button>
        <Button
          variant="ghost"
          onClick={() => router.push("/diagnosis")}
          className="w-full"
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          새로 진단하기
        </Button>
      </div>
    </div>
  );
}
