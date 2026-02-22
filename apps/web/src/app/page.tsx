import Link from "next/link";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  BagajiScore,
} from "@ggaba/ui";
import { ClipboardCheck, TrendingDown, Shield, ArrowRight, Gavel, FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { RecentTicker } from "./_components/recent-ticker";
import { getAuctionSummary } from "./_actions/home";

const AI_DIAGNOSIS_ENABLED =
  process.env.NEXT_PUBLIC_ENABLE_AI_DIAGNOSIS === "true";

export default async function Home() {
  const supabase = await createClient();

  // 인기 커뮤니티 게시글 쿼리 (공통)
  const popularPostsQuery = supabase
    .from("community_posts")
    .select("id, title, type, view_count, like_count, created_at, users!inner(nickname)")
    .order("view_count", { ascending: false })
    .limit(3);

  // AI 진단 관련 데이터 (Feature Flag ON일 때만 fetch)
  let recentEstimates: Record<string, unknown>[] | null = null;
  let totalDiagnosis: number | null = null;
  let avgScore = 0;
  let auctionSummary: { activeAuctions: number; totalBids: number } | null = null;
  let popularPosts: Record<string, unknown>[] | null = null;

  if (AI_DIAGNOSIS_ENABLED) {
    // AI 모드: 3개 estimates 쿼리 + popularPosts 병렬 실행
    const [recentResult, countResult, avgResult, postsResult] = await Promise.all([
      supabase
        .from("estimates")
        .select("id, title, region, size_pyeong, bad_price_score, created_at")
        .eq("status", "diagnosed")
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("estimates")
        .select("*", { count: "exact", head: true })
        .eq("status", "diagnosed"),
      supabase
        .from("estimates")
        .select("bad_price_score")
        .eq("status", "diagnosed")
        .not("bad_price_score", "is", null),
      popularPostsQuery,
    ]);

    recentEstimates = recentResult.data;
    totalDiagnosis = countResult.count;
    popularPosts = postsResult.data;

    const avgScoreData = avgResult.data;
    avgScore =
      avgScoreData && avgScoreData.length > 0
        ? Math.round(
            avgScoreData.reduce(
              (sum: number, e: Record<string, unknown>) =>
                sum + ((e.bad_price_score as number) ?? 0),
              0
            ) / avgScoreData.length
          )
        : 0;
  } else {
    // 일반 모드: auctionSummary + popularPosts 병렬 실행
    const [auctionResult, postsResult] = await Promise.all([
      getAuctionSummary(),
      popularPostsQuery,
    ]);
    auctionSummary = auctionResult;
    popularPosts = postsResult.data;
  }

  return (
    <div className="flex flex-col gap-6 p-4 pt-8">
      {/* Hero */}
      <section className="flex flex-col gap-3 text-center">
        <h1 className="text-2xl font-bold tracking-tight">
          인테리어 견적,
          <br />
          <span className="text-primary">바가지</span> 없이 투명하게
        </h1>
        <p className="text-sm text-muted-foreground">
          {AI_DIAGNOSIS_ENABLED
            ? "견적서를 올리면 AI가 적정 가격을 분석해드립니다"
            : "비공개 역경매로 합리적인 시공사를 만나보세요"}
        </p>
        {AI_DIAGNOSIS_ENABLED ? (
          <Button size="lg" className="mt-2" asChild>
            <Link href="/diagnosis">
              <ClipboardCheck className="mr-2 h-5 w-5" />
              무료 견적 진단받기
            </Link>
          </Button>
        ) : (
          <Button size="lg" className="mt-2" asChild>
            <Link href="/auction/new">
              시공 요청하기
            </Link>
          </Button>
        )}
      </section>

      {/* 경매 현황 위젯 (AI 진단 OFF일 때) */}
      {!AI_DIAGNOSIS_ENABLED && auctionSummary && (
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="flex flex-col items-center gap-1 p-4">
              <Gavel className="h-5 w-5 text-primary" />
              <p className="text-2xl font-bold text-primary">
                {auctionSummary.activeAuctions}
              </p>
              <p className="text-xs text-muted-foreground">활성 경매</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col items-center gap-1 p-4">
              <FileText className="h-5 w-5 text-primary" />
              <p className="text-2xl font-bold text-primary">
                {auctionSummary.totalBids}
              </p>
              <p className="text-xs text-muted-foreground">받은 입찰</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TODO: Phase 5 — 인기 시공사 미리보기 (시공사 데이터 생성 후) */}
      {/* TODO: Phase 5 — 최근 리뷰 미리보기 (리뷰 데이터 생성 후) */}

      {/* 실시간 티커 (AI 진단 ON일 때만) */}
      {AI_DIAGNOSIS_ENABLED && recentEstimates && recentEstimates.length > 0 && (
        <RecentTicker
          estimates={recentEstimates.map((e) => ({
            id: e.id as string,
            region: (e.region as string) ?? "",
            sizePyeong: e.size_pyeong ? String(e.size_pyeong) : "",
            badPriceScore: (e.bad_price_score as number) ?? 0,
          }))}
        />
      )}

      {/* 서비스 통계 (AI 진단 ON일 때만) */}
      {AI_DIAGNOSIS_ENABLED && (
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="flex flex-col items-center p-4">
              <p className="text-2xl font-bold text-primary">
                {totalDiagnosis ?? 0}
              </p>
              <p className="text-xs text-muted-foreground">총 진단 수</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col items-center p-4">
              <p className="text-2xl font-bold text-primary">{avgScore}</p>
              <p className="text-xs text-muted-foreground">평균 바가지 점수</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 바가지 점수 설명 (AI 진단 ON일 때만) */}
      {AI_DIAGNOSIS_ENABLED && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">바가지 점수란?</CardTitle>
            <CardDescription>
              0에 가까울수록 합리적, 100에 가까울수록 바가지
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BagajiScore score={avgScore || 35} />
          </CardContent>
        </Card>
      )}

      {/* 인기 게시글 */}
      {popularPosts && popularPosts.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">인기 게시글</h2>
            <Link
              href="/community"
              className="flex items-center gap-1 text-xs text-primary"
            >
              더보기 <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {popularPosts.map((post: Record<string, unknown>) => {
            const postUser = post.users as Record<string, unknown> | null;
            return (
              <Link key={post.id as string} href={`/community/${post.id}`}>
                <Card className="transition-colors hover:bg-accent/30">
                  <CardContent className="flex items-center gap-3 p-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium line-clamp-1">
                        {post.title as string}
                      </p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        {postUser?.nickname ? String(postUser.nickname) : "사용자"} · 조회 {String(post.view_count)}
                      </p>
                    </div>
                    <TypeBadge type={post.type as string} />
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </section>
      )}

      {/* Features */}
      <section className="grid gap-3">
        {AI_DIAGNOSIS_ENABLED && (
          <>
            <FeatureCard
              icon={<ClipboardCheck className="h-6 w-6 text-primary" />}
              title="AI 견적 진단"
              description="견적서 사진만 올리면 항목별 적정 가격을 분석합니다"
            />
            <FeatureCard
              icon={<TrendingDown className="h-6 w-6 text-safe" />}
              title="시세 비교"
              description="지역별, 평수별 평균 시세와 비교해드립니다"
            />
          </>
        )}
        <FeatureCard
          icon={<Shield className="h-6 w-6 text-primary" />}
          title="개인정보 보호"
          description="업로드한 견적서의 개인정보는 자동으로 마스킹됩니다"
        />
      </section>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-start gap-4 p-4">
        <div className="rounded-lg bg-accent p-2">{icon}</div>
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function TypeBadge({ type }: { type: string }) {
  const styles: Record<string, string> = {
    share: "bg-primary/10 text-primary",
    review: "bg-safe/10 text-safe",
    qna: "bg-warning/10 text-warning",
  };
  const labels: Record<string, string> = {
    share: "공유",
    review: "후기",
    qna: "질문",
  };
  return (
    <span
      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${styles[type] ?? ""}`}
    >
      {labels[type] ?? type}
    </span>
  );
}
