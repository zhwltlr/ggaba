"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardContent, Skeleton } from "@ggaba/ui";
import { cn } from "@ggaba/lib/utils";
import { PenSquare, Eye, Heart, MessageCircle, Hammer } from "lucide-react";
import { useCommunityPosts } from "@/hooks/use-community";
import type { PostType, PostItem } from "@/app/community/_actions/posts";

const TABS: { label: string; value: PostType | undefined }[] = [
  { label: "전체", value: undefined },
  { label: "견적공유", value: "share" },
  { label: "시공후기", value: "review" },
  { label: "질문", value: "qna" },
  { label: "시공팁", value: "contractor_tip" },
  { label: "자재정보", value: "material_info" },
];

const TYPE_BADGE: Record<PostType, { label: string; className: string }> = {
  share: { label: "견적공유", className: "bg-primary/10 text-primary" },
  review: { label: "시공후기", className: "bg-safe/10 text-safe" },
  qna: { label: "질문", className: "bg-warning/10 text-warning" },
  contractor_tip: { label: "시공팁", className: "bg-violet-100 text-violet-700" },
  material_info: { label: "자재정보", className: "bg-amber-100 text-amber-700" },
};

export default function CommunityPageClient() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<PostType | undefined>(undefined);
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useCommunityPosts(activeTab);

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

  const posts = data?.pages.flatMap((page) => page.posts) ?? [];

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">커뮤니티</h1>
        <Button
          size="sm"
          onClick={() => router.push("/community/write")}
        >
          <PenSquare className="mr-1.5 h-4 w-4" />
          글쓰기
        </Button>
      </div>

      {/* 탭 필터 */}
      <div className="flex gap-2 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.label}
            type="button"
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              activeTab === tab.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 피드 목록 */}
      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="flex flex-col gap-3 p-4">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <MessageCircle className="h-12 w-12 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            아직 게시글이 없습니다
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/community/write")}
          >
            첫 게시글 작성하기
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {posts.map((post) => (
            <CommunityCard
              key={post.id}
              post={post}
              onClick={() => router.push(`/community/${post.id}`)}
            />
          ))}

          {/* Infinite scroll trigger */}
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

function CommunityCard({
  post,
  onClick,
}: {
  post: PostItem;
  onClick: () => void;
}) {
  const badge = TYPE_BADGE[post.type];
  const timeAgo = getTimeAgo(post.created_at);

  return (
    <Card
      className="cursor-pointer transition-colors hover:bg-accent/30"
      onClick={onClick}
    >
      <CardContent className="flex flex-col gap-2.5 p-4">
        {/* 작성자 */}
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
            {post.nickname.charAt(0)}
          </div>
          <span className="text-xs font-medium">{post.nickname}</span>
          {post.user_mode === "contractor" && (
            <span className="flex items-center gap-0.5 rounded-full bg-violet-100 px-1.5 py-0.5 text-[9px] font-medium text-violet-700">
              <Hammer className="h-2.5 w-2.5" />
              시공사
            </span>
          )}
          <span className="text-xs text-muted-foreground">{timeAgo}</span>
          <span
            className={cn(
              "ml-auto rounded-full px-2 py-0.5 text-[10px] font-medium",
              badge.className
            )}
          >
            {badge.label}
          </span>
        </div>

        {/* 제목 + 내용 미리보기 */}
        <h3 className="text-sm font-semibold leading-snug">{post.title}</h3>
        <p className="line-clamp-2 text-xs text-muted-foreground">
          {post.content}
        </p>

        {/* 견적 요약 (연결된 경우) */}
        {post.estimate_id && post.estimate_score !== null && (
          <div className="flex items-center gap-2 rounded-md bg-accent/50 px-3 py-1.5">
            <span className="text-[10px] text-muted-foreground">
              {post.estimate_region} {post.estimate_size && `${post.estimate_size}평`}
            </span>
            <span
              className={cn(
                "ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold",
                post.estimate_score <= 30
                  ? "bg-safe/10 text-safe"
                  : post.estimate_score <= 60
                    ? "bg-warning/10 text-warning"
                    : "bg-danger/10 text-danger"
              )}
            >
              바가지 {post.estimate_score}점
            </span>
          </div>
        )}

        {/* 통계 */}
        <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {post.view_count}
          </span>
          <span className="flex items-center gap-1">
            <Heart className="h-3 w-3" />
            {post.like_count}
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle className="h-3 w-3" />
            {post.comment_count}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function getTimeAgo(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "방금";
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}일 전`;
  return new Date(dateStr).toLocaleDateString("ko-KR");
}
