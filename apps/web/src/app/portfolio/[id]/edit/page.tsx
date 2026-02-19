"use client";

import { useState, useCallback, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Input, Skeleton } from "@ggaba/ui";
import { useToast } from "@ggaba/ui";
import { ArrowLeft, X, ImagePlus } from "lucide-react";
import { getPortfolio, updatePortfolio } from "@/app/portfolio/_actions/portfolio";
import { uploadPortfolioImage } from "@/app/portfolio/_actions/upload";
import { useAuth } from "@/hooks/use-auth";

const portfolioSchema = z.object({
  title: z.string().min(1, "제목을 입력해주세요").max(200),
  description: z.string().max(5000).optional(),
  region: z.string().max(100).optional(),
  sizePyeong: z.coerce.number().int().positive().optional().or(z.literal("")),
  durationDays: z.coerce.number().int().positive().optional().or(z.literal("")),
  totalCost: z.coerce.number().int().positive().optional().or(z.literal("")),
});

type PortfolioForm = z.infer<typeof portfolioSchema>;

export default function PortfolioEditPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [beforeImages, setBeforeImages] = useState<string[]>([]);
  const [afterImages, setAfterImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PortfolioForm>({
    resolver: zodResolver(portfolioSchema),
  });

  // 기존 데이터 로드
  useEffect(() => {
    if (authLoading) return;

    getPortfolio(id).then((result) => {
      if (result.error || !result.portfolio) {
        toast({ title: "포트폴리오를 찾을 수 없습니다", variant: "destructive" });
        router.replace("/portfolio");
        return;
      }

      const p = result.portfolio;

      // 소유자 검증
      if (user?.id !== p.contractor_id) {
        router.replace("/portfolio");
        return;
      }

      reset({
        title: p.title,
        description: p.description ?? "",
        region: p.region ?? "",
        sizePyeong: p.size_pyeong ?? "",
        durationDays: p.duration_days ?? "",
        totalCost: p.total_cost ?? "",
      });
      setBeforeImages(p.before_image_urls);
      setAfterImages(p.after_image_urls);
      setDataLoading(false);
    });
  }, [id, user, authLoading, reset, toast, router]);

  const handleImageUpload = useCallback(
    async (files: FileList | null, type: "before" | "after") => {
      if (!files || files.length === 0) return;

      setUploading(true);
      try {
        const urls: string[] = [];
        for (const file of Array.from(files)) {
          const formData = new FormData();
          formData.append("file", file);
          const result = await uploadPortfolioImage(formData);
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

        if (type === "before") {
          setBeforeImages((prev) => [...prev, ...urls]);
        } else {
          setAfterImages((prev) => [...prev, ...urls]);
        }
      } finally {
        setUploading(false);
      }
    },
    [toast]
  );

  const removeImage = (type: "before" | "after", index: number) => {
    if (type === "before") {
      setBeforeImages((prev) => prev.filter((_, i) => i !== index));
    } else {
      setAfterImages((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const onSubmit = useCallback(
    async (formData: PortfolioForm) => {
      setIsSubmitting(true);
      try {
        const result = await updatePortfolio(id, {
          title: formData.title,
          description: formData.description || undefined,
          region: formData.region || undefined,
          sizePyeong:
            formData.sizePyeong !== "" && formData.sizePyeong
              ? Number(formData.sizePyeong)
              : undefined,
          durationDays:
            formData.durationDays !== "" && formData.durationDays
              ? Number(formData.durationDays)
              : undefined,
          totalCost:
            formData.totalCost !== "" && formData.totalCost
              ? Number(formData.totalCost)
              : undefined,
          beforeImageUrls: beforeImages,
          afterImageUrls: afterImages,
        });

        if (result.error) {
          toast({
            title: "수정 실패",
            description: result.error,
            variant: "destructive",
          });
          return;
        }

        toast({ title: "포트폴리오가 수정되었습니다!" });
        router.push(`/portfolio/${id}`);
      } finally {
        setIsSubmitting(false);
      }
    },
    [id, beforeImages, afterImages, toast, router]
  );

  if (dataLoading || authLoading) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-full p-1 hover:bg-muted"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold">포트폴리오 수정</h1>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-4"
      >
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">
            제목 <span className="text-destructive">*</span>
          </label>
          <Input placeholder="시공 제목을 입력하세요" {...register("title")} />
          {errors.title && (
            <p className="text-xs text-destructive">{errors.title.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">설명</label>
          <textarea
            placeholder="시공 내용을 상세히 설명해주세요"
            rows={5}
            {...register("description")}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">시공 지역</label>
            <Input placeholder="예: 서울 강남" {...register("region")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">평수</label>
            <Input
              type="number"
              placeholder="예: 32"
              {...register("sizePyeong")}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">시공 기간 (일)</label>
            <Input
              type="number"
              placeholder="예: 30"
              {...register("durationDays")}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">총 비용 (원)</label>
            <Input
              type="number"
              placeholder="예: 35000000"
              {...register("totalCost")}
            />
          </div>
        </div>

        {/* Before 이미지 */}
        <ImageUploadSection
          label="Before 이미지"
          images={beforeImages}
          uploading={uploading}
          onUpload={(files) => handleImageUpload(files, "before")}
          onRemove={(index) => removeImage("before", index)}
        />

        {/* After 이미지 */}
        <ImageUploadSection
          label="After 이미지"
          images={afterImages}
          uploading={uploading}
          onUpload={(files) => handleImageUpload(files, "after")}
          onRemove={(index) => removeImage("after", index)}
        />

        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting || uploading}
          className="w-full"
        >
          {isSubmitting ? "수정 중..." : "포트폴리오 수정"}
        </Button>
      </form>
    </div>
  );
}

function ImageUploadSection({
  label,
  images,
  uploading,
  onUpload,
  onRemove,
}: {
  label: string;
  images: string[];
  uploading: boolean;
  onUpload: (files: FileList | null) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium">{label}</label>
      <div className="flex flex-wrap gap-2">
        {images.map((url, i) => (
          <div key={url} className="relative h-20 w-20">
            <img
              src={url}
              alt={`${label} ${i + 1}`}
              className="h-full w-full rounded-md object-cover"
            />
            <button
              type="button"
              onClick={() => onRemove(i)}
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
            onChange={(e) => onUpload(e.target.files)}
            disabled={uploading}
          />
          <ImagePlus className="h-6 w-6 text-muted-foreground" />
        </label>
      </div>
    </div>
  );
}
