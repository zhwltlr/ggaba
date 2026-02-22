"use client";

import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, Skeleton, Button } from "@ggaba/ui";
import { ArrowLeft, MapPin, Ruler, Banknote, Clock, Pencil } from "lucide-react";
import { usePortfolio } from "@/hooks/use-portfolio";
import { useAuth } from "@/hooks/use-auth";

export default function PortfolioDetailClient() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data, isLoading } = usePortfolio(id);
  const { user } = useAuth();

  const portfolio = data?.portfolio;
  const isOwner = user?.id === portfolio?.contractor_id;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <p className="text-sm text-muted-foreground">
          포트폴리오를 찾을 수 없습니다
        </p>
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          뒤로가기
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-full p-1 hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-bold line-clamp-1">{portfolio.title}</h1>
        </div>
        {isOwner && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/portfolio/${id}/edit`)}
          >
            <Pencil className="mr-1 h-3.5 w-3.5" />
            수정
          </Button>
        )}
      </div>

      {/* 시공 정보 */}
      <Card>
        <CardContent className="flex flex-wrap gap-4 p-4">
          {portfolio.region && (
            <div className="flex items-center gap-1.5 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              {portfolio.region}
            </div>
          )}
          {portfolio.size_pyeong && (
            <div className="flex items-center gap-1.5 text-sm">
              <Ruler className="h-4 w-4 text-muted-foreground" />
              {portfolio.size_pyeong}평
            </div>
          )}
          {portfolio.duration_days && (
            <div className="flex items-center gap-1.5 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              {portfolio.duration_days}일
            </div>
          )}
          {portfolio.total_cost && (
            <div className="flex items-center gap-1.5 text-sm">
              <Banknote className="h-4 w-4 text-muted-foreground" />
              {portfolio.total_cost.toLocaleString()}원
            </div>
          )}
        </CardContent>
      </Card>

      {/* 설명 */}
      {portfolio.description && (
        <Card>
          <CardContent className="p-4">
            <p className="whitespace-pre-wrap text-sm leading-relaxed">
              {portfolio.description}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Before 이미지 */}
      {portfolio.before_image_urls.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-muted-foreground">Before</h2>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {portfolio.before_image_urls.map((url, i) => (
              <img
                key={url}
                src={url}
                alt={`Before ${i + 1}`}
                className="h-48 w-64 shrink-0 rounded-lg object-cover"
              />
            ))}
          </div>
        </div>
      )}

      {/* After 이미지 */}
      {portfolio.after_image_urls.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-safe">After</h2>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {portfolio.after_image_urls.map((url, i) => (
              <img
                key={url}
                src={url}
                alt={`After ${i + 1}`}
                className="h-48 w-64 shrink-0 rounded-lg object-cover"
              />
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        등록일 {new Date(portfolio.created_at).toLocaleDateString("ko-KR")}
      </p>
    </div>
  );
}
