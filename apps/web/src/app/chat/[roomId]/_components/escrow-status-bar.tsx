"use client";

import { Button } from "@ggaba/ui";
import { useToast } from "@ggaba/ui";
import { cn } from "@ggaba/lib/utils";
import {
  FileSignature,
  Banknote,
  Hammer,
  CheckCircle2,
  Wallet,
} from "lucide-react";

const STEPS = [
  { label: "계약 체결", icon: FileSignature },
  { label: "착수금 입금", icon: Banknote },
  { label: "시공 중", icon: Hammer },
  { label: "시공 완료", icon: CheckCircle2 },
  { label: "잔금 정산", icon: Wallet },
];

interface EscrowStatusBarProps {
  currentStep: number;
}

export function EscrowStatusBar({ currentStep }: EscrowStatusBarProps) {
  const { toast } = useToast();

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card p-3">
      {/* 진행 단계 */}
      <div className="flex items-center justify-between">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;

          return (
            <div key={step.label} className="flex flex-col items-center gap-1">
              <div className="flex items-center">
                <div
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full transition-colors",
                    isCompleted && "bg-safe text-safe-foreground",
                    isCurrent && "bg-primary text-primary-foreground",
                    !isCompleted && !isCurrent && "bg-muted text-muted-foreground"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={cn(
                      "h-0.5 w-3 sm:w-5",
                      index < currentStep ? "bg-safe" : "bg-muted"
                    )}
                  />
                )}
              </div>
              <span
                className={cn(
                  "text-[9px] leading-tight",
                  isCurrent
                    ? "font-semibold text-primary"
                    : isCompleted
                      ? "text-safe"
                      : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* 계약서 작성 버튼 (Phase 4에서는 disabled) */}
      <Button
        size="sm"
        variant="outline"
        className="w-full"
        disabled
        onClick={() =>
          toast({
            title: "준비 중",
            description: "표준 계약서 작성 기능은 준비 중입니다.",
          })
        }
      >
        <FileSignature className="mr-1.5 h-3.5 w-3.5" />
        표준 계약서 작성
      </Button>
    </div>
  );
}
