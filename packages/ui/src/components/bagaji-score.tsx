"use client";

import * as React from "react";
import { cn } from "@ggaba/lib/utils";
import { Progress } from "./progress";

export interface BagajiScoreProps {
  /** 바가지 점수 (0~100). 높을수록 바가지 */
  score: number;
  /** 라벨 표시 여부 */
  showLabel?: boolean;
  /** 크기 */
  size?: "sm" | "md" | "lg";
  className?: string;
}

function getScoreLevel(score: number) {
  if (score <= 30) return { label: "합리적", color: "bg-safe", textColor: "text-safe" } as const;
  if (score <= 60) return { label: "보통", color: "bg-warning", textColor: "text-warning" } as const;
  if (score <= 80) return { label: "주의", color: "bg-danger/70", textColor: "text-danger" } as const;
  return { label: "바가지", color: "bg-danger", textColor: "text-danger" } as const;
}

const sizeStyles = {
  sm: { bar: "h-2", text: "text-xs", score: "text-lg" },
  md: { bar: "h-3", text: "text-sm", score: "text-2xl" },
  lg: { bar: "h-4", text: "text-base", score: "text-4xl" },
};

export function BagajiScore({
  score,
  showLabel = true,
  size = "md",
  className,
}: BagajiScoreProps) {
  const clamped = Math.max(0, Math.min(100, score));
  const level = getScoreLevel(clamped);
  const styles = sizeStyles[size];

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {showLabel && (
        <div className="flex items-end justify-between">
          <div className="flex items-center gap-2">
            <span className={cn("font-bold tabular-nums", styles.score, level.textColor)}>
              {clamped}
            </span>
            <span className={cn("font-medium", styles.text, level.textColor)}>
              / 100
            </span>
          </div>
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 font-semibold",
              styles.text,
              level.color,
              "text-white"
            )}
          >
            {level.label}
          </span>
        </div>
      )}
      <Progress
        value={clamped}
        className={styles.bar}
        indicatorClassName={level.color}
      />
      {showLabel && (
        <div className={cn("flex justify-between", styles.text, "text-muted-foreground")}>
          <span>합리적</span>
          <span>바가지</span>
        </div>
      )}
    </div>
  );
}
