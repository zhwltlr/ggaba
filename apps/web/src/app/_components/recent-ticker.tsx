"use client";

import { useState, useEffect } from "react";
import { cn } from "@ggaba/lib/utils";
import { Activity } from "lucide-react";

interface TickerItem {
  id: string;
  region: string;
  sizePyeong: string;
  badPriceScore: number;
}

export function RecentTicker({ estimates }: { estimates: TickerItem[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (estimates.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % estimates.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [estimates.length]);

  if (estimates.length === 0) return null;

  const current = estimates[currentIndex];

  return (
    <div className="flex items-center gap-2 rounded-lg bg-accent/50 px-4 py-2.5">
      <Activity className="h-4 w-4 shrink-0 text-primary" />
      <div className="flex-1 overflow-hidden">
        <p className="truncate text-xs">
          <span className="font-medium">{current.region || "지역 미설정"}</span>
          {current.sizePyeong && (
            <span className="text-muted-foreground"> {current.sizePyeong}평</span>
          )}
          <span className="text-muted-foreground"> 방금 분석 완료</span>
        </p>
      </div>
      <span
        className={cn(
          "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold",
          current.badPriceScore <= 30
            ? "bg-safe/10 text-safe"
            : current.badPriceScore <= 60
              ? "bg-warning/10 text-warning"
              : "bg-danger/10 text-danger"
        )}
      >
        {current.badPriceScore}점
      </span>
    </div>
  );
}
