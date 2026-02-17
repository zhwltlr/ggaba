"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { Button, Card, CardContent } from "@ggaba/ui";
import { Eraser, RotateCcw, ImageIcon } from "lucide-react";
import { cn } from "@ggaba/lib/utils";
import { useDiagnosisStore } from "@/stores/use-diagnosis-store";

const BLUR_RADIUS = 20;

export function StepMasking() {
  const { uploadedImages, masking, setMasking } = useDiagnosisStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(BLUR_RADIUS);

  const currentImage = uploadedImages[selectedImageIndex];

  // 이미지를 캔버스에 로드
  useEffect(() => {
    if (!currentImage?.url || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      // 모바일에서 적당한 크기로 조정
      const maxWidth = canvas.parentElement?.clientWidth ?? 400;
      const scale = maxWidth / img.width;
      canvas.width = maxWidth;
      canvas.height = img.height * scale;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = currentImage.url;
  }, [currentImage?.url]);

  const getPos = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      if ("touches" in e) {
        const touch = e.touches[0];
        return {
          x: (touch.clientX - rect.left) * scaleX,
          y: (touch.clientY - rect.top) * scaleY,
        };
      }
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    },
    []
  );

  const drawBlur = useCallback(
    (x: number, y: number) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;

      // 선택 영역의 픽셀을 블러 처리
      const size = brushSize;
      const sx = Math.max(0, Math.floor(x - size));
      const sy = Math.max(0, Math.floor(y - size));
      const sw = Math.min(size * 2, canvas.width - sx);
      const sh = Math.min(size * 2, canvas.height - sy);

      if (sw <= 0 || sh <= 0) return;

      const imageData = ctx.getImageData(sx, sy, sw, sh);
      const { data } = imageData;

      // 간단한 박스 블러
      const pixelSize = 8;
      for (let py = 0; py < sh; py += pixelSize) {
        for (let px = 0; px < sw; px += pixelSize) {
          let r = 0, g = 0, b = 0, count = 0;
          for (let dy = 0; dy < pixelSize && py + dy < sh; dy++) {
            for (let dx = 0; dx < pixelSize && px + dx < sw; dx++) {
              const idx = ((py + dy) * sw + (px + dx)) * 4;
              r += data[idx];
              g += data[idx + 1];
              b += data[idx + 2];
              count++;
            }
          }
          r = Math.floor(r / count);
          g = Math.floor(g / count);
          b = Math.floor(b / count);
          for (let dy = 0; dy < pixelSize && py + dy < sh; dy++) {
            for (let dx = 0; dx < pixelSize && px + dx < sw; dx++) {
              const idx = ((py + dy) * sw + (px + dx)) * 4;
              data[idx] = r;
              data[idx + 1] = g;
              data[idx + 2] = b;
            }
          }
        }
      }
      ctx.putImageData(imageData, sx, sy);
    },
    [brushSize]
  );

  const handleStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      setIsDrawing(true);
      const pos = getPos(e);
      drawBlur(pos.x, pos.y);
    },
    [getPos, drawBlur]
  );

  const handleMove = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDrawing) return;
      e.preventDefault();
      const pos = getPos(e);
      drawBlur(pos.x, pos.y);
    },
    [isDrawing, getPos, drawBlur]
  );

  const handleEnd = useCallback(() => {
    setIsDrawing(false);
  }, []);

  // 이미지 리셋
  const resetImage = useCallback(() => {
    if (!currentImage?.url || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = currentImage.url;
  }, [currentImage?.url]);

  if (uploadedImages.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-muted-foreground">
        <ImageIcon className="h-12 w-12" />
        <p className="text-sm">업로드된 이미지가 없습니다</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* 마스킹 옵션 */}
      <Card>
        <CardContent className="flex flex-col gap-3 p-4">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={masking.isImageMasked}
              onChange={(e) => setMasking({ isImageMasked: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300"
            />
            <span className="text-sm">이미지 마스킹 적용</span>
          </label>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={masking.isTextMasked}
              onChange={(e) => setMasking({ isTextMasked: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300"
            />
            <span className="text-sm">텍스트 정보 마스킹 (전화번호, 주소)</span>
          </label>
        </CardContent>
      </Card>

      {/* 이미지 선택 탭 */}
      {uploadedImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {uploadedImages.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setSelectedImageIndex(i)}
              className={cn(
                "h-12 w-12 shrink-0 overflow-hidden rounded-md border-2 transition-colors",
                i === selectedImageIndex
                  ? "border-primary"
                  : "border-transparent opacity-60"
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={`이미지 ${i + 1}`}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* 캔버스 */}
      <div className="overflow-hidden rounded-lg border">
        <canvas
          ref={canvasRef}
          className="w-full touch-none"
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
        />
      </div>

      {/* 도구 */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Eraser className="h-4 w-4 text-muted-foreground" />
          <input
            type="range"
            min={10}
            max={50}
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="w-24"
          />
          <span className="text-xs text-muted-foreground">{brushSize}px</span>
        </div>
        <Button variant="outline" size="sm" onClick={resetImage}>
          <RotateCcw className="mr-1 h-3 w-3" />
          초기화
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        손가락이나 마우스로 민감한 정보(전화번호, 주소 등)를 문질러 블러
        처리하세요.
      </p>
    </div>
  );
}
