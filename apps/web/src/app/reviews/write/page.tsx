"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@ggaba/ui";
import { useToast } from "@ggaba/ui";
import { ArrowLeft, Star, X, ImagePlus } from "lucide-react";
import { useCreateReview } from "@/hooks/use-review";
import { uploadReviewImage } from "@/app/reviews/_actions/upload";

const reviewSchema = z.object({
  content: z.string().min(10, "리뷰는 최소 10자 이상 작성해주세요").max(2000),
});

type ReviewForm = z.infer<typeof reviewSchema>;

export default function ReviewWritePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const contractorId = searchParams.get("contractorId") ?? "";
  const auctionId = searchParams.get("auctionId") ?? undefined;

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const createReview = useCreateReview();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ReviewForm>({
    resolver: zodResolver(reviewSchema),
  });

  const handleImageUpload = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;

      setUploading(true);
      try {
        const urls: string[] = [];
        for (const file of Array.from(files)) {
          const formData = new FormData();
          formData.append("file", file);
          const result = await uploadReviewImage(formData);
          if (result.error) {
            toast({
              title: "이미지 업로드 실패",
              description: result.error,
              variant: "destructive",
            });
            continue;
          }
          if (result.url) urls.push(result.url);
        }
        setImages((prev) => [...prev, ...urls]);
      } finally {
        setUploading(false);
      }
    },
    [toast]
  );

  const onSubmit = useCallback(
    async (formData: ReviewForm) => {
      if (rating === 0) {
        toast({
          title: "별점을 선택해주세요",
          variant: "destructive",
        });
        return;
      }

      if (!contractorId) {
        toast({
          title: "시공사 정보가 없습니다",
          variant: "destructive",
        });
        return;
      }

      createReview.mutate(
        {
          partnerId: contractorId,
          auctionId,
          rating,
          content: formData.content,
          imageUrls: images.length > 0 ? images : undefined,
        },
        {
          onSuccess: (result) => {
            if (result.error) {
              toast({
                title: "리뷰 작성 실패",
                description: result.error,
                variant: "destructive",
              });
              return;
            }
            toast({ title: "리뷰가 등록되었습니다!" });
            router.push(`/contractor/${contractorId}`);
          },
        }
      );
    },
    [rating, contractorId, auctionId, images, createReview, toast, router]
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
        <h1 className="text-lg font-bold">리뷰 작성</h1>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-4"
      >
        {/* 별점 */}
        <div className="flex flex-col items-center gap-2">
          <p className="text-sm font-medium">시공 만족도를 평가해주세요</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                onMouseEnter={() => setHoverRating(value)}
                onMouseLeave={() => setHoverRating(0)}
                className="p-0.5"
              >
                <Star
                  className={`h-8 w-8 transition-colors ${
                    value <= (hoverRating || rating)
                      ? "fill-warning text-warning"
                      : "text-muted-foreground/30"
                  }`}
                />
              </button>
            ))}
          </div>
          {rating > 0 && (
            <p className="text-xs text-muted-foreground">{rating}점</p>
          )}
        </div>

        {/* 내용 */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">
            리뷰 내용 <span className="text-destructive">*</span>
          </label>
          <textarea
            placeholder="시공 경험을 자세히 알려주세요 (최소 10자)"
            rows={6}
            {...register("content")}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {errors.content && (
            <p className="text-xs text-destructive">
              {errors.content.message}
            </p>
          )}
        </div>

        {/* 이미지 업로드 */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">사진 첨부 (선택)</label>
          <div className="flex flex-wrap gap-2">
            {images.map((url, i) => (
              <div key={url} className="relative h-20 w-20">
                <img
                  src={url}
                  alt={`리뷰 이미지 ${i + 1}`}
                  className="h-full w-full rounded-md object-cover"
                />
                <button
                  type="button"
                  onClick={() =>
                    setImages((prev) => prev.filter((_, idx) => idx !== i))
                  }
                  className="absolute -right-1 -top-1 rounded-full bg-destructive p-0.5 text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            <label className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-md border-2 border-dashed border-input hover:border-primary">
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleImageUpload(e.target.files)}
                disabled={uploading}
              />
              <ImagePlus className="h-6 w-6 text-muted-foreground" />
            </label>
          </div>
          {uploading && (
            <p className="text-xs text-muted-foreground">업로드 중...</p>
          )}
        </div>

        <Button
          type="submit"
          size="lg"
          disabled={createReview.isPending || uploading || rating === 0}
          className="w-full"
        >
          {createReview.isPending ? "등록 중..." : "리뷰 등록"}
        </Button>
      </form>
    </div>
  );
}
