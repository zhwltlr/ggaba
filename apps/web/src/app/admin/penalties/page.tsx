"use client";

import { Suspense, useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Card, CardContent, Input, Skeleton } from "@ggaba/ui";
import { useToast } from "@ggaba/ui";
import { cn } from "@ggaba/lib/utils";
import { ArrowLeft, Plus, X } from "lucide-react";
import {
  useAdminPenalties,
  useIssuePenalty,
  useRevokePenalty,
} from "@/hooks/use-admin";
import type { PenaltyFilter } from "@/app/admin/_actions/admin-penalties";

const FILTER_TABS: { value: PenaltyFilter; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "active", label: "활성" },
  { value: "expired", label: "해제됨" },
];

const TYPE_LABEL: Record<string, string> = {
  warning: "경고",
  suspension: "이용정지",
};

const TYPE_BADGE: Record<string, string> = {
  warning: "bg-warning/10 text-warning",
  suspension: "bg-danger/10 text-danger",
};

export default function AdminPenaltiesPageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <AdminPenaltiesPage />
    </Suspense>
  );
}

function AdminPenaltiesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<PenaltyFilter>("all");
  const [showForm, setShowForm] = useState(false);
  const [formUserId, setFormUserId] = useState("");
  const [formType, setFormType] = useState<"warning" | "suspension">("warning");
  const [formReason, setFormReason] = useState("");
  const [formExpiresAt, setFormExpiresAt] = useState("");

  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useAdminPenalties(activeTab);
  const issueMutation = useIssuePenalty();
  const revokeMutation = useRevokePenalty();

  const observerRef = useRef<HTMLDivElement>(null);
  const prefillReportId = searchParams.get("reportId");

  // URL 파라미터로 프리필
  useEffect(() => {
    const userId = searchParams.get("userId");
    if (userId) {
      setFormUserId(userId);
      setShowForm(true);
    }
  }, [searchParams]);

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry?.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage]
  );

  useEffect(() => {
    const el = observerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(handleObserver, {
      threshold: 0.1,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleObserver]);

  const handleIssue = async () => {
    if (!formUserId.trim()) {
      toast({ title: "사용자 ID를 입력해주세요", variant: "destructive" });
      return;
    }
    if (!formReason.trim()) {
      toast({ title: "사유를 입력해주세요", variant: "destructive" });
      return;
    }

    const result = await issueMutation.mutateAsync({
      userId: formUserId.trim(),
      type: formType,
      reason: formReason.trim(),
      reportId: prefillReportId ?? undefined,
      expiresAt: formExpiresAt || undefined,
    });

    if (result.error) {
      toast({
        title: "페널티 부여 실패",
        description: result.error,
        variant: "destructive",
      });
      return;
    }

    toast({ title: "페널티가 부여되었습니다." });
    setShowForm(false);
    setFormUserId("");
    setFormReason("");
    setFormExpiresAt("");
  };

  const handleRevoke = async (penaltyId: string) => {
    const result = await revokeMutation.mutateAsync(penaltyId);
    if (result.error) {
      toast({
        title: "해제 실패",
        description: result.error,
        variant: "destructive",
      });
      return;
    }
    toast({ title: "페널티가 해제되었습니다." });
  };

  const penalties = data?.pages.flatMap((p) => p.penalties) ?? [];

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/admin")}
            className="rounded-full p-1 hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-bold">페널티 관리</h1>
        </div>
        {!showForm && (
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="mr-1 h-3.5 w-3.5" />
            부여
          </Button>
        )}
      </div>

      {/* 페널티 부여 폼 */}
      {showForm && (
        <Card className="border-primary/30">
          <CardContent className="flex flex-col gap-3 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold">페널티 부여</h3>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-full p-1 hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">
                사용자 ID
              </label>
              <Input
                placeholder="UUID 형식의 사용자 ID"
                value={formUserId}
                onChange={(e) => setFormUserId(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">
                유형
              </label>
              <div className="flex gap-2">
                {(["warning", "suspension"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setFormType(t)}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                      formType === t
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {TYPE_LABEL[t]}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">
                사유
              </label>
              <Input
                placeholder="페널티 사유를 입력하세요"
                value={formReason}
                onChange={(e) => setFormReason(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">
                만료일 (선택)
              </label>
              <Input
                type="date"
                value={formExpiresAt}
                onChange={(e) => setFormExpiresAt(e.target.value)}
              />
            </div>

            <Button
              size="sm"
              onClick={handleIssue}
              disabled={issueMutation.isPending}
            >
              {issueMutation.isPending ? "처리 중..." : "페널티 부여"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 필터 탭 */}
      <div className="flex gap-2">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              activeTab === tab.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 목록 */}
      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : penalties.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          페널티 내역이 없습니다.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {penalties.map((penalty) => (
            <Card key={penalty.id}>
              <CardContent className="flex flex-col gap-2 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-medium",
                        TYPE_BADGE[penalty.type]
                      )}
                    >
                      {TYPE_LABEL[penalty.type]}
                    </span>
                    {penalty.is_active ? (
                      <span className="rounded-full bg-danger/10 px-2 py-0.5 text-[10px] font-medium text-danger">
                        활성
                      </span>
                    ) : (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                        해제됨
                      </span>
                    )}
                  </div>
                  {penalty.is_active && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 text-[10px]"
                      onClick={() => handleRevoke(penalty.id)}
                      disabled={revokeMutation.isPending}
                    >
                      해제
                    </Button>
                  )}
                </div>
                <p className="text-xs">
                  <span className="font-medium">{penalty.user_nickname}</span>
                  <span className="ml-1 text-muted-foreground">
                    ({penalty.user_email})
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {penalty.reason}
                </p>
                <div className="flex gap-4 text-[10px] text-muted-foreground">
                  <span>
                    부여일:{" "}
                    {new Date(penalty.created_at).toLocaleDateString("ko-KR")}
                  </span>
                  {penalty.expires_at && (
                    <span>
                      만료일:{" "}
                      {new Date(penalty.expires_at).toLocaleDateString("ko-KR")}
                    </span>
                  )}
                  <span>부여자: {penalty.created_by_nickname}</span>
                </div>
              </CardContent>
            </Card>
          ))}
          <div ref={observerRef} className="h-4" />
          {isFetchingNextPage && (
            <Skeleton className="h-20 w-full rounded-lg" />
          )}
        </div>
      )}
    </div>
  );
}
