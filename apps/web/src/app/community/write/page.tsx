"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
} from "@ggaba/ui";
import { useToast } from "@ggaba/ui";
import { cn } from "@ggaba/lib/utils";
import { ArrowLeft, Link2, X } from "lucide-react";
import { createPost, type PostType } from "@/app/community/_actions/posts";
import { createClient } from "@/lib/supabase/client";
import { useUserStore } from "@/stores/use-user-store";

const postSchema = z.object({
  title: z.string().min(1, "제목을 입력해주세요").max(200),
  content: z.string().min(1, "내용을 입력해주세요").max(5000),
});

type PostForm = z.infer<typeof postSchema>;

const COMMON_TYPES: { value: PostType; label: string; desc: string }[] = [
  { value: "share", label: "견적공유", desc: "견적서를 공유하고 의견을 구해요" },
  { value: "review", label: "시공후기", desc: "시공 경험을 공유해요" },
  { value: "qna", label: "질문", desc: "인테리어 관련 질문을 올려요" },
];

const CONTRACTOR_TYPES: { value: PostType; label: string; desc: string }[] = [
  { value: "contractor_tip", label: "시공팁", desc: "시공 노하우를 공유해요" },
  { value: "material_info", label: "자재정보", desc: "자재 정보를 공유해요" },
];

interface EstimateOption {
  id: string;
  title: string;
  bad_price_score: number | null;
  created_at: string;
}

export default function CommunityWritePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { userMode } = useUserStore();

  const postTypes =
    userMode === "contractor"
      ? [...COMMON_TYPES, ...CONTRACTOR_TYPES]
      : COMMON_TYPES;

  const [postType, setPostType] = useState<PostType>("share");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedEstimate, setSelectedEstimate] = useState<string | null>(null);
  const [estimates, setEstimates] = useState<EstimateOption[]>([]);
  const [showEstimatePicker, setShowEstimatePicker] = useState(false);
  const [isPriceMasked, setIsPriceMasked] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PostForm>({
    resolver: zodResolver(postSchema),
  });

  // 내 견적 목록 로드 (견적 첨부용)
  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("estimates")
      .select("id, title, bad_price_score, created_at")
      .eq("status", "diagnosed")
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (data) setEstimates(data as EstimateOption[]);
      });
  }, []);

  const onSubmit = useCallback(
    async (formData: PostForm) => {
      setIsSubmitting(true);
      try {
        const result = await createPost({
          type: postType,
          title: formData.title,
          content: formData.content,
          estimateId: selectedEstimate ?? undefined,
          isPriceMasked,
        });

        if (result.error) {
          toast({
            title: "게시글 작성 실패",
            description: result.error,
            variant: "destructive",
          });
          return;
        }

        toast({ title: "게시글이 작성되었습니다!" });
        router.push(`/community/${result.postId}`);
      } finally {
        setIsSubmitting(false);
      }
    },
    [postType, selectedEstimate, isPriceMasked, toast, router]
  );

  const selectedEstimateData = estimates.find((e) => e.id === selectedEstimate);

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
        <h1 className="text-lg font-bold">글쓰기</h1>
      </div>

      {/* 유형 선택 */}
      <div className="flex flex-wrap gap-2">
        {postTypes.map((pt) => (
          <button
            key={pt.value}
            type="button"
            onClick={() => setPostType(pt.value)}
            className={cn(
              "flex-1 rounded-lg border p-3 text-center transition-colors",
              postType === pt.value
                ? "border-primary bg-primary/5"
                : "border-input hover:bg-accent"
            )}
          >
            <p className="text-sm font-medium">{pt.label}</p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              {pt.desc}
            </p>
          </button>
        ))}
      </div>

      {/* 폼 */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-4"
      >
        {/* 제목 */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">제목</label>
          <Input placeholder="제목을 입력하세요" {...register("title")} />
          {errors.title && (
            <p className="text-xs text-destructive">{errors.title.message}</p>
          )}
        </div>

        {/* 내용 */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">내용</label>
          <textarea
            placeholder="내용을 입력하세요"
            rows={8}
            {...register("content")}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {errors.content && (
            <p className="text-xs text-destructive">{errors.content.message}</p>
          )}
        </div>

        {/* 견적 첨부 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">견적 첨부 (선택)</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {selectedEstimateData ? (
              <div className="flex items-center gap-2 rounded-md bg-accent/50 px-3 py-2">
                <Link2 className="h-4 w-4 text-primary" />
                <span className="flex-1 text-xs font-medium">
                  {selectedEstimateData.title}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedEstimate(null)}
                  className="rounded-full p-1 hover:bg-muted"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowEstimatePicker(!showEstimatePicker)}
              >
                <Link2 className="mr-1.5 h-4 w-4" />
                금고에서 견적 첨부
              </Button>
            )}

            {showEstimatePicker && !selectedEstimate && (
              <div className="flex flex-col gap-1 rounded-md border p-2">
                {estimates.length === 0 ? (
                  <p className="py-2 text-center text-xs text-muted-foreground">
                    진단 완료된 견적이 없습니다
                  </p>
                ) : (
                  estimates.map((est) => (
                    <button
                      key={est.id}
                      type="button"
                      onClick={() => {
                        setSelectedEstimate(est.id);
                        setShowEstimatePicker(false);
                      }}
                      className="flex items-center justify-between rounded-md px-3 py-2 text-left text-xs hover:bg-accent"
                    >
                      <span>{est.title}</span>
                      {est.bad_price_score !== null && (
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-bold",
                            est.bad_price_score <= 30
                              ? "bg-safe/10 text-safe"
                              : est.bad_price_score <= 60
                                ? "bg-warning/10 text-warning"
                                : "bg-danger/10 text-danger"
                          )}
                        >
                          {est.bad_price_score}점
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>
            )}

            {selectedEstimate && (
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isPriceMasked}
                  onChange={(e) => setIsPriceMasked(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <span className="text-xs">가격 정보 마스킹</span>
              </label>
            )}
          </CardContent>
        </Card>

        {/* 제출 */}
        <Button type="submit" size="lg" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "게시 중..." : "게시하기"}
        </Button>
      </form>
    </div>
  );
}
