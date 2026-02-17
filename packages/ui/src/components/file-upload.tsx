"use client";

import * as React from "react";
import { Upload, Camera, X, FileText } from "lucide-react";
import { cn } from "@ggaba/lib/utils";

export interface FileUploadProps {
  accept?: string;
  maxSizeMB?: number;
  onFileSelect: (file: File) => void;
  onError?: (message: string) => void;
  className?: string;
  selectedFile?: File | null;
  onClear?: () => void;
}

export function FileUpload({
  accept = "image/*,.pdf,.xlsx,.xls,.csv",
  maxSizeMB = 10,
  onFileSelect,
  onError,
  className,
  selectedFile,
  onClear,
}: FileUploadProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = React.useState(false);

  function handleFile(file: File) {
    if (file.size > maxSizeMB * 1024 * 1024) {
      onError?.(`파일 크기는 ${maxSizeMB}MB 이하여야 합니다.`);
      return;
    }
    onFileSelect(file);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  if (selectedFile) {
    return (
      <div
        className={cn(
          "flex items-center gap-3 rounded-lg border bg-accent/50 p-4",
          className
        )}
      >
        <FileText className="h-8 w-8 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{selectedFile.name}</p>
          <p className="text-xs text-muted-foreground">
            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
          </p>
        </div>
        {onClear && (
          <button
            type="button"
            onClick={onClear}
            className="rounded-full p-1 hover:bg-muted"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 transition-colors",
        isDragOver
          ? "border-primary bg-accent/50"
          : "border-muted-foreground/25 hover:border-primary/50",
        className
      )}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
    >
      <div className="flex gap-3">
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
        견적서 파일을 드래그하거나 선택해주세요
      </p>
      <p className="text-xs text-muted-foreground">
        이미지, PDF, Excel (최대 {maxSizeMB}MB)
      </p>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
}
