"use client";

import { useCallback, useRef } from "react";
import { Upload, Camera, X, ImageIcon } from "lucide-react";
import { Button } from "@ggaba/ui";
import { useToast } from "@ggaba/ui";
import { cn } from "@ggaba/lib/utils";
import { useDiagnosisStore, type UploadedImage } from "@/stores/use-diagnosis-store";

const MAX_FILES = 5;
const MAX_SIZE_MB = 10;

export function StepUpload() {
  const { uploadedImages, addImage, removeImage } = useDiagnosisStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;

      const remaining = MAX_FILES - uploadedImages.length;
      if (remaining <= 0) {
        toast({
          title: "최대 업로드 수 초과",
          description: `최대 ${MAX_FILES}장까지 업로드할 수 있습니다.`,
          variant: "destructive",
        });
        return;
      }

      const filesToProcess = Array.from(files).slice(0, remaining);

      filesToProcess.forEach((file) => {
        if (file.size > MAX_SIZE_MB * 1024 * 1024) {
          toast({
            title: "파일 크기 초과",
            description: `${file.name}의 크기가 ${MAX_SIZE_MB}MB를 초과합니다.`,
            variant: "destructive",
          });
          return;
        }

        const image: UploadedImage = {
          id: crypto.randomUUID(),
          name: file.name,
          url: URL.createObjectURL(file),
          size: file.size,
          type: file.type,
        };
        addImage(image);
      });
    },
    [uploadedImages.length, addImage, toast]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  return (
    <div className="flex flex-col gap-4">
      {/* 업로드 영역 */}
      <div
        className={cn(
          "relative flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 transition-colors",
          "border-muted-foreground/25 hover:border-primary/50"
        )}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex flex-col items-center gap-2 rounded-lg p-3 transition-colors hover:bg-muted"
          >
            <Upload className="h-8 w-8 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">파일 선택</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (inputRef.current) {
                inputRef.current.setAttribute("capture", "environment");
                inputRef.current.click();
                inputRef.current.removeAttribute("capture");
              }
            }}
            className="flex flex-col items-center gap-2 rounded-lg p-3 transition-colors hover:bg-muted"
          >
            <Camera className="h-8 w-8 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">카메라</span>
          </button>
        </div>
        <p className="text-center text-sm text-muted-foreground">
          견적서 사진을 드래그하거나 선택해주세요
        </p>
        <p className="text-xs text-muted-foreground">
          이미지 (최대 {MAX_FILES}장, 각 {MAX_SIZE_MB}MB)
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
          className="hidden"
        />
      </div>

      {/* 업로드된 이미지 목록 */}
      {uploadedImages.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">
            업로드된 파일 ({uploadedImages.length}/{MAX_FILES})
          </p>
          <div className="grid grid-cols-3 gap-2">
            {uploadedImages.map((img) => (
              <div key={img.id} className="group relative">
                <div className="aspect-square overflow-hidden rounded-lg border bg-muted">
                  {img.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={img.url}
                      alt={img.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeImage(img.id)}
                  className="absolute -right-1 -top-1 rounded-full bg-destructive p-1 text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <X className="h-3 w-3" />
                </button>
                <p className="mt-1 truncate text-[10px] text-muted-foreground">
                  {img.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {uploadedImages.length === 0 && (
        <p className="text-center text-xs text-muted-foreground">
          견적서 이미지를 업로드해야 다음 단계로 진행할 수 있습니다
        </p>
      )}
    </div>
  );
}
