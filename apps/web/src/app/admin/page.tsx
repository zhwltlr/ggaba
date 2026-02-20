"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@ggaba/ui";
import { Shield, AlertTriangle, Ban } from "lucide-react";
import { getPendingReportCount } from "@/app/admin/_actions/admin-reports";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    getPendingReportCount().then((res) => {
      if (!res.error) {
        setPendingCount(res.count);
      }
    });
  }, []);

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* 헤더 */}
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5 text-primary" />
        <h1 className="text-lg font-bold">관리자 대시보드</h1>
      </div>

      {/* 카드 링크 */}
      <div className="flex flex-col gap-3">
        <Card
          className="cursor-pointer transition-colors hover:bg-accent/50"
          onClick={() => router.push("/admin/reports")}
        >
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/10">
              <AlertTriangle className="h-5 w-5 text-warning" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">신고 관리</p>
              <p className="text-xs text-muted-foreground">
                접수된 신고를 검토하고 처리합니다
              </p>
            </div>
            {pendingCount > 0 && (
              <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">
                {pendingCount}
              </span>
            )}
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer transition-colors hover:bg-accent/50"
          onClick={() => router.push("/admin/penalties")}
        >
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-danger/10">
              <Ban className="h-5 w-5 text-danger" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">페널티 관리</p>
              <p className="text-xs text-muted-foreground">
                경고/정지 부여 및 관리
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
