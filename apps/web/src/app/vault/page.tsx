"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  CardContent,
  Skeleton,
} from "@ggaba/ui";
import { cn } from "@ggaba/lib/utils";
import { formatCurrency } from "@ggaba/lib/utils/format";
import { FolderOpen, ClipboardCheck, Calendar } from "lucide-react";
import { getMyEstimates } from "./_actions/estimates";

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  pending: { label: "대기중", className: "bg-muted text-muted-foreground" },
  diagnosing: { label: "분석중", className: "bg-warning/10 text-warning" },
  diagnosed: { label: "완료", className: "bg-safe/10 text-safe" },
  expired: { label: "만료", className: "bg-destructive/10 text-destructive" },
};

interface EstimateItem {
  id: string;
  title: string;
  status: string;
  region: string | null;
  size_pyeong: string | null;
  building_type: string | null;
  total_price: number | null;
  bad_price_score: number | null;
  created_at: string;
}

export default function VaultPage() {
  const router = useRouter();
  const [estimates, setEstimates] = useState<EstimateItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyEstimates().then((res) => {
      setEstimates(res.estimates as EstimateItem[]);
      setLoading(false);
    });
  }, []);

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-2">
        <FolderOpen className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold">금고</h1>
      </div>
      <p className="text-xs text-muted-foreground">
        진단 완료된 견적서가 안전하게 보관됩니다
      </p>

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="flex flex-col gap-2 p-4">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : estimates.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <FolderOpen className="h-16 w-16 text-muted-foreground/30" />
          <div>
            <p className="text-sm font-medium">아직 진단한 견적이 없어요</p>
            <p className="mt-1 text-xs text-muted-foreground">
              견적서를 업로드하고 바가지 점수를 확인해보세요
            </p>
          </div>
          <Button onClick={() => router.push("/diagnosis")}>
            <ClipboardCheck className="mr-2 h-4 w-4" />
            견적 진단하기
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {estimates.map((est) => {
            const statusInfo = STATUS_LABELS[est.status] ?? STATUS_LABELS.pending;
            return (
              <Card
                key={est.id}
                className="cursor-pointer transition-colors hover:bg-accent/30"
                onClick={() => router.push(`/diagnosis/result/${est.id}`)}
              >
                <CardContent className="flex flex-col gap-2 p-4">
                  <div className="flex items-start justify-between">
                    <h3 className="text-sm font-semibold line-clamp-1">
                      {est.title}
                    </h3>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium",
                        statusInfo.className
                      )}
                    >
                      {statusInfo.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {est.region && <span>{est.region}</span>}
                    {est.size_pyeong && <span>{est.size_pyeong}평</span>}
                    {est.building_type && <span>{est.building_type}</span>}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {new Date(est.created_at).toLocaleDateString("ko-KR")}
                    </div>

                    <div className="flex items-center gap-3">
                      {est.total_price && (
                        <span className="text-xs font-medium">
                          {formatCurrency(est.total_price)}
                        </span>
                      )}
                      {est.bad_price_score !== null && (
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-bold",
                            est.bad_price_score <= 30
                              ? "bg-safe/10 text-safe"
                              : est.bad_price_score <= 60
                                ? "bg-warning/10 text-warning"
                                : "bg-danger/10 text-danger"
                          )}
                        >
                          바가지 {est.bad_price_score}점
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
