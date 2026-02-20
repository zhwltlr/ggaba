"use client";

import { useState } from "react";
import { Button, Card, CardContent, Input } from "@ggaba/ui";
import { useToast } from "@ggaba/ui";
import { Flag, X } from "lucide-react";
import { submitReport } from "@/app/_actions/reports";
import type { ReportTargetType, ReportReason } from "@/app/_actions/reports";

const REASON_OPTIONS: { value: ReportReason; label: string }[] = [
  { value: "fake_bid", label: "허위 입찰" },
  { value: "inappropriate", label: "부적절한 내용" },
  { value: "spam", label: "스팸/광고" },
  { value: "false_info", label: "허위 정보" },
  { value: "harassment", label: "괴롭힘/비방" },
  { value: "other", label: "기타" },
];

interface ReportDialogProps {
  targetType: ReportTargetType;
  targetId: string;
}

export function ReportDialog({ targetType, targetId }: ReportDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason) {
      toast({
        title: "사유를 선택해주세요",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    const result = await submitReport({
      targetType,
      targetId,
      reason,
      description: description.trim() || undefined,
    });
    setSubmitting(false);

    if (result.error) {
      toast({
        title: "신고 실패",
        description: result.error,
        variant: "destructive",
      });
      return;
    }

    toast({ title: "신고가 접수되었습니다." });
    setOpen(false);
    setReason(null);
    setDescription("");
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-destructive"
      >
        <Flag className="h-3 w-3" />
        신고
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-sm">
        <CardContent className="flex flex-col gap-4 p-4">
          {/* 헤더 */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold">신고하기</h3>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full p-1 hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* 사유 선택 */}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-muted-foreground">
              신고 사유를 선택해주세요
            </p>
            {REASON_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className="flex cursor-pointer items-center gap-2 rounded-md border p-2.5 text-xs transition-colors hover:bg-accent has-[:checked]:border-primary has-[:checked]:bg-primary/5"
              >
                <input
                  type="radio"
                  name="report-reason"
                  value={opt.value}
                  checked={reason === opt.value}
                  onChange={() => setReason(opt.value)}
                  className="accent-primary"
                />
                {opt.label}
              </label>
            ))}
          </div>

          {/* 상세 설명 */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">
              상세 설명 (선택)
            </label>
            <Input
              placeholder="추가 설명을 입력해주세요"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* 버튼 */}
          <div className="flex gap-2">
            <Button
              className="flex-1"
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
            >
              취소
            </Button>
            <Button
              className="flex-1"
              size="sm"
              disabled={!reason || submitting}
              onClick={handleSubmit}
            >
              {submitting ? "접수 중..." : "신고 접수"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
