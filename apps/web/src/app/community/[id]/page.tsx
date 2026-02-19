"use client";

import { useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  BagajiScore,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Skeleton,
  Input,
} from "@ggaba/ui";
import { useToast } from "@ggaba/ui";
import { cn } from "@ggaba/lib/utils";
import { formatCurrency } from "@ggaba/lib/utils/format";
import { ArrowLeft, Send, Reply, Eye, Heart, MessageCircle } from "lucide-react";
import { useCommunityPost, useAddComment } from "@/hooks/use-community";
import { useAuth } from "@/hooks/use-auth";

const RATING_STYLES: Record<string, string> = {
  적정: "text-safe",
  주의: "text-warning",
  과다: "text-danger font-semibold",
  저가: "text-blue-500",
};

const TYPE_LABEL: Record<string, string> = {
  share: "견적공유",
  review: "시공후기",
  qna: "질문",
  contractor_tip: "시공팁",
  material_info: "자재정보",
};

export default function CommunityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const { data, isLoading } = useCommunityPost(id);
  const addCommentMutation = useAddComment(id);

  const [commentText, setCommentText] = useState("");
  const [replyTo, setReplyTo] = useState<{
    id: string;
    nickname: string;
  } | null>(null);

  const handleAddComment = useCallback(async () => {
    if (!commentText.trim()) return;
    if (!user) {
      toast({
        title: "로그인 필요",
        description: "댓글을 작성하려면 로그인해주세요.",
        variant: "destructive",
      });
      return;
    }

    const result = await addCommentMutation.mutateAsync({
      content: commentText.trim(),
      parentId: replyTo?.id,
    });

    if (result.error) {
      toast({
        title: "댓글 작성 실패",
        description: result.error,
        variant: "destructive",
      });
      return;
    }

    setCommentText("");
    setReplyTo(null);
  }, [commentText, user, replyTo, addCommentMutation, toast]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-40 w-full rounded-lg" />
        <Skeleton className="h-24 w-full rounded-lg" />
      </div>
    );
  }

  if (!data?.post) {
    return (
      <div className="flex flex-col items-center gap-4 p-8">
        <p className="text-sm text-muted-foreground">게시글을 찾을 수 없습니다.</p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          돌아가기
        </Button>
      </div>
    );
  }

  const { post, comments } = data;
  const postUser = post.users as Record<string, unknown>;
  const estimate = post.estimates as Record<string, unknown> | null;
  const estimateItems = (estimate?.estimate_items ?? []) as Record<string, unknown>[];

  // 댓글을 트리 구조로 변환
  const topLevelComments = comments.filter(
    (c: Record<string, unknown>) => !c.parent_id
  );
  const replies = comments.filter(
    (c: Record<string, unknown>) => !!c.parent_id
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
        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
          {TYPE_LABEL[post.type as string] ?? post.type}
        </span>
      </div>

      {/* 작성자 + 제목 */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
            {(postUser?.nickname as string)?.charAt(0) ?? "?"}
          </div>
          <div>
            <p className="text-sm font-medium">{postUser?.nickname as string}</p>
            <p className="text-[10px] text-muted-foreground">
              {new Date(post.created_at as string).toLocaleDateString("ko-KR")}
            </p>
          </div>
        </div>
        <h1 className="text-lg font-bold">{post.title}</h1>
      </div>

      {/* 본문 */}
      <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
        {post.content}
      </div>

      {/* 통계 */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Eye className="h-3.5 w-3.5" /> {post.view_count}
        </span>
        <span className="flex items-center gap-1">
          <Heart className="h-3.5 w-3.5" /> {post.like_count}
        </span>
        <span className="flex items-center gap-1">
          <MessageCircle className="h-3.5 w-3.5" /> {comments.length}
        </span>
      </div>

      {/* 연결된 견적 */}
      {estimate && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">첨부된 견적</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {/* 바가지 점수 */}
            {estimate.bad_price_score != null && (
              <BagajiScore score={estimate.bad_price_score as number} size="sm" />
            )}

            {/* 요약 */}
            <div className="flex gap-4 text-xs text-muted-foreground">
              {estimate.region ? <span>{String(estimate.region)}</span> : null}
              {estimate.size_pyeong ? <span>{String(estimate.size_pyeong)}평</span> : null}
              {estimate.total_price ? (
                <span className="font-medium text-foreground">
                  {formatCurrency(estimate.total_price as number)}
                </span>
              ) : null}
            </div>

            {/* 항목 테이블 */}
            {estimateItems.length > 0 && (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[80px]">항목</TableHead>
                      <TableHead className="w-20 text-right">단가</TableHead>
                      <TableHead className="w-20 text-right">금액</TableHead>
                      <TableHead className="w-14 text-center">판정</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {estimateItems.map((item) => (
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
                        <TableCell className="text-right text-xs">
                          {formatCurrency((item.total_price as number) ?? 0)}
                        </TableCell>
                        <TableCell
                          className={cn(
                            "text-center text-xs",
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
            )}
          </CardContent>
        </Card>
      )}

      {/* 투표 */}
      <Card>
        <CardContent className="flex justify-center gap-4 p-4">
          {[
            { label: "싸다", emoji: "👍" },
            { label: "적당하다", emoji: "🤝" },
            { label: "비싸다", emoji: "👎" },
          ].map((vote) => (
            <button
              key={vote.label}
              type="button"
              onClick={() =>
                toast({ title: `"${vote.label}"에 투표했습니다` })
              }
              className="flex flex-col items-center gap-1 rounded-lg px-4 py-2 transition-colors hover:bg-accent"
            >
              <span className="text-2xl">{vote.emoji}</span>
              <span className="text-xs text-muted-foreground">{vote.label}</span>
            </button>
          ))}
        </CardContent>
      </Card>

      {/* 댓글 섹션 */}
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold">
          댓글 {comments.length > 0 && `(${comments.length})`}
        </h3>

        {/* 댓글 목록 */}
        {topLevelComments.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">
            아직 댓글이 없습니다. 첫 댓글을 작성해보세요!
          </p>
        ) : (
          topLevelComments.map((comment: Record<string, unknown>) => {
            const commentUser = comment.users as Record<string, unknown>;
            const childReplies = replies.filter(
              (r: Record<string, unknown>) => r.parent_id === comment.id
            );

            return (
              <div key={comment.id as string} className="flex flex-col gap-2">
                <CommentItem
                  nickname={commentUser?.nickname as string}
                  content={comment.content as string}
                  createdAt={comment.created_at as string}
                  onReply={() =>
                    setReplyTo({
                      id: comment.id as string,
                      nickname: commentUser?.nickname as string,
                    })
                  }
                />
                {/* 대댓글 */}
                {childReplies.map((reply: Record<string, unknown>) => {
                  const replyUser = reply.users as Record<string, unknown>;
                  return (
                    <div key={reply.id as string} className="ml-8">
                      <CommentItem
                        nickname={replyUser?.nickname as string}
                        content={reply.content as string}
                        createdAt={reply.created_at as string}
                      />
                    </div>
                  );
                })}
              </div>
            );
          })
        )}

        {/* 댓글 입력 */}
        <div className="flex flex-col gap-2">
          {replyTo && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Reply className="h-3 w-3" />
              <span>{replyTo.nickname}에게 답글</span>
              <button
                type="button"
                onClick={() => setReplyTo(null)}
                className="text-destructive hover:underline"
              >
                취소
              </button>
            </div>
          )}
          <div className="flex gap-2">
            <Input
              placeholder={user ? "댓글을 입력하세요" : "로그인 후 댓글을 작성할 수 있습니다"}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleAddComment();
                }
              }}
              disabled={!user}
            />
            <Button
              size="icon"
              onClick={handleAddComment}
              disabled={!commentText.trim() || addCommentMutation.isPending}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CommentItem({
  nickname,
  content,
  createdAt,
  onReply,
}: {
  nickname: string;
  content: string;
  createdAt: string;
  onReply?: () => void;
}) {
  const timeAgo = getTimeAgo(createdAt);

  return (
    <div className="flex gap-2">
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold">
        {nickname?.charAt(0) ?? "?"}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium">{nickname}</span>
          <span className="text-[10px] text-muted-foreground">{timeAgo}</span>
        </div>
        <p className="mt-0.5 text-xs text-foreground/90">{content}</p>
        {onReply && (
          <button
            type="button"
            onClick={onReply}
            className="mt-1 text-[10px] text-muted-foreground hover:text-foreground"
          >
            답글
          </button>
        )}
      </div>
    </div>
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
