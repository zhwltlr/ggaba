"use client";

import { useEffect } from "react";
import { Button } from "@ggaba/ui";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 p-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="h-8 w-8 text-destructive" />
      </div>
      <div>
        <h2 className="text-lg font-bold">문제가 발생했습니다</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          일시적인 오류가 발생했습니다. 다시 시도해주세요.
        </p>
      </div>
      <div className="flex gap-3">
        <Button variant="outline" onClick={reset}>
          <RotateCcw className="mr-2 h-4 w-4" />
          다시 시도
        </Button>
        <Button onClick={() => (window.location.href = "/")}>
          <Home className="mr-2 h-4 w-4" />
          홈으로
        </Button>
      </div>
    </div>
  );
}
