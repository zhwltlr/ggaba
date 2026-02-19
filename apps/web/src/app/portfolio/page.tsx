"use client";

import { useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, Skeleton, Button } from "@ggaba/ui";
import { ImageIcon, Plus, MapPin, Ruler, Banknote } from "lucide-react";
import { useMyPortfolios } from "@/hooks/use-portfolio";
import { useUserStore } from "@/stores/use-user-store";
import type { PortfolioItem } from "./_types";

export default function PortfolioPage() {
  const router = useRouter();
  const { userMode } = useUserStore();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useMyPortfolios();

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

  const portfolios = data?.pages.flatMap((page) => page.portfolios) ?? [];

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">내 포트폴리오</h1>
        {userMode === "contractor" && (
          <Button
            size="sm"
            onClick={() => router.push("/portfolio/write")}
          >
            <Plus className="mr-1 h-4 w-4" />새 포트폴리오
          </Button>
        )}
      </div>

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
      ) : portfolios.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            아직 포트폴리오가 없습니다
          </p>
          {userMode === "contractor" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/portfolio/write")}
            >
              첫 포트폴리오 작성하기
            </Button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {portfolios.map((portfolio) => (
            <PortfolioCard
              key={portfolio.id}
              portfolio={portfolio}
              onClick={() => router.push(`/portfolio/${portfolio.id}`)}
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

function PortfolioCard({
  portfolio,
  onClick,
}: {
  portfolio: PortfolioItem;
  onClick: () => void;
}) {
  const imageCount =
    portfolio.before_image_urls.length + portfolio.after_image_urls.length;

  return (
    <Card
      className="cursor-pointer transition-colors hover:bg-accent/30"
      onClick={onClick}
    >
      <CardContent className="flex flex-col gap-2 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold line-clamp-1">
            {portfolio.title}
          </h3>
          {imageCount > 0 && (
            <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
              사진 {imageCount}장
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {portfolio.region && (
            <span className="flex items-center gap-0.5">
              <MapPin className="h-3 w-3" />
              {portfolio.region}
            </span>
          )}
          {portfolio.size_pyeong && (
            <span className="flex items-center gap-0.5">
              <Ruler className="h-3 w-3" />
              {portfolio.size_pyeong}평
            </span>
          )}
          {portfolio.total_cost && (
            <span className="flex items-center gap-0.5">
              <Banknote className="h-3 w-3" />
              {portfolio.total_cost.toLocaleString()}원
            </span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {portfolio.before_image_urls.length > 0 && (
              <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                Before {portfolio.before_image_urls.length}
              </span>
            )}
            {portfolio.after_image_urls.length > 0 && (
              <span className="rounded bg-safe/10 px-1.5 py-0.5 text-[10px] text-safe">
                After {portfolio.after_image_urls.length}
              </span>
            )}
          </div>
          <span className="text-[11px] text-muted-foreground">
            {new Date(portfolio.created_at).toLocaleDateString("ko-KR")}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
