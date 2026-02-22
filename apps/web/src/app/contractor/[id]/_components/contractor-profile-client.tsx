"use client";

import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, Skeleton, Button } from "@ggaba/ui";
import {
  ArrowLeft,
  Star,
  BadgeCheck,
  Briefcase,
  MapPin,
  ImageIcon,
  MessageSquare,
} from "lucide-react";
import { useContractorProfile } from "@/hooks/use-contractor";
import { useContractorPortfolios } from "@/hooks/use-portfolio";
import { useContractorReviews } from "@/hooks/use-review";
import type { PortfolioItem } from "@/app/portfolio/_types";

export default function ContractorProfileClient() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: profileData, isLoading: profileLoading } =
    useContractorProfile(id);
  const { data: portfolioData } = useContractorPortfolios(id);
  const { data: reviewData } = useContractorReviews(id);

  const profile = profileData?.profile;
  const portfolios = portfolioData?.pages.flatMap((p) => p.portfolios) ?? [];
  const reviews = reviewData?.pages.flatMap((p) => p.reviews) ?? [];

  if (profileLoading) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <p className="text-sm text-muted-foreground">
          시공사를 찾을 수 없습니다
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
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-full p-1 hover:bg-muted"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold">시공사 프로필</h1>
      </div>

      {/* 프로필 카드 */}
      <Card>
        <CardContent className="flex flex-col gap-3 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
              {profile.profile_image_url ? (
                <img
                  src={profile.profile_image_url}
                  alt={profile.nickname}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                profile.nickname.charAt(0)
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <h2 className="font-semibold">
                  {profile.company_name ?? profile.nickname}
                </h2>
                {profile.verified && (
                  <BadgeCheck className="h-4 w-4 text-safe" />
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {profile.nickname}
              </p>
            </div>
          </div>

          {profile.specialty.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {profile.specialty.map((s) => (
                <span
                  key={s}
                  className="flex items-center gap-0.5 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary"
                >
                  <Briefcase className="h-3 w-3" />
                  {s}
                </span>
              ))}
            </div>
          )}

          {profile.service_regions.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {profile.service_regions.map((r) => (
                <span
                  key={r}
                  className="flex items-center gap-0.5 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground"
                >
                  <MapPin className="h-3 w-3" />
                  {r}
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 통계 */}
      <div className="grid grid-cols-3 gap-2">
        <Card>
          <CardContent className="flex flex-col items-center p-3">
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
            <span className="mt-1 text-lg font-bold">
              {profile.portfolio_count}
            </span>
            <span className="text-[10px] text-muted-foreground">포트폴리오</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center p-3">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <span className="mt-1 text-lg font-bold">
              {profile.review_count}
            </span>
            <span className="text-[10px] text-muted-foreground">리뷰</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center p-3">
            <Star className="h-4 w-4 text-warning" />
            <span className="mt-1 text-lg font-bold">
              {profile.avg_rating > 0 ? profile.avg_rating.toFixed(1) : "-"}
            </span>
            <span className="text-[10px] text-muted-foreground">평균 별점</span>
          </CardContent>
        </Card>
      </div>

      {/* 포트폴리오 갤러리 */}
      {portfolios.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold">포트폴리오</h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {portfolios.map((p) => (
              <PortfolioMiniCard
                key={p.id}
                portfolio={p}
                onClick={() => router.push(`/portfolio/${p.id}`)}
              />
            ))}
          </div>
        </div>
      )}

      {/* 최근 리뷰 */}
      {reviews.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold">리뷰</h2>
          <div className="flex flex-col gap-2">
            {reviews.slice(0, 5).map((review) => (
              <Card key={review.id}>
                <CardContent className="flex flex-col gap-1.5 p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3.5 w-3.5 ${
                            i < review.rating
                              ? "fill-warning text-warning"
                              : "text-muted-foreground/30"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(review.created_at).toLocaleDateString("ko-KR")}
                    </span>
                  </div>
                  {review.content && (
                    <p className="text-xs leading-relaxed line-clamp-3">
                      {review.content}
                    </p>
                  )}
                  <span className="text-[10px] text-muted-foreground">
                    {review.nickname}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PortfolioMiniCard({
  portfolio,
  onClick,
}: {
  portfolio: PortfolioItem;
  onClick: () => void;
}) {
  const thumbnail =
    portfolio.after_image_urls[0] ?? portfolio.before_image_urls[0];

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-40 shrink-0 flex-col gap-1.5 rounded-lg border p-2 text-left transition-colors hover:bg-accent/30"
    >
      {thumbnail ? (
        <img
          src={thumbnail}
          alt={portfolio.title}
          className="h-24 w-full rounded-md object-cover"
        />
      ) : (
        <div className="flex h-24 w-full items-center justify-center rounded-md bg-muted">
          <ImageIcon className="h-6 w-6 text-muted-foreground/50" />
        </div>
      )}
      <p className="text-xs font-medium line-clamp-1">{portfolio.title}</p>
      {portfolio.region && (
        <p className="text-[10px] text-muted-foreground">{portfolio.region}</p>
      )}
    </button>
  );
}
