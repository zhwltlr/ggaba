"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Skeleton,
} from "@ggaba/ui";
import { useToast } from "@ggaba/ui";
import { cn } from "@ggaba/lib/utils";
import { ArrowLeft, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { useAdminReportDetail, useResolveReport } from "@/hooks/use-admin";
import { useIssuePenalty } from "@/hooks/use-admin";

const REASON_LABEL: Record<string, string> = {
  fake_bid: "허위 입찰",
  inappropriate: "부적절한 내용",
  spam: "스팸/광고",
  false_info: "허위 정보",
  harassment: "괴롭힘/비방",
  other: "기타",
};

const TARGET_LABEL: Record<string, string> = {
  post: "게시글",
  comment: "댓글",
  bid: "입찰",
};

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-warning/10 text-warning",
  reviewing: "bg-primary/10 text-primary",
  resolved: "bg-safe/10 text-safe",
  dismissed: "bg-muted text-muted-foreground",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "대기",
  reviewing: "검토중",
  resolved: "처리완료",
  dismissed: "기각",
};

export default function AdminReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const { data, isLoading } = useAdminReportDetail(id);
  const resolveMutation = useResolveReport();
  const issuePenaltyMutation = useIssuePenalty();

  const [adminNote, setAdminNote] = useState("");
  const [showPenaltyForm, setShowPenaltyForm] = useState(false);
  const [penaltyType, setPenaltyType] = useState<"warning" | "suspension">(
    "warning"
  );
  const [penaltyReason, setPenaltyReason] = useState("");

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-40 w-full rounded-lg" />
        <Skeleton className="h-40 w-full rounded-lg" />
      </div>
    );
  }

  if (!data?.report) {
    return (
      <div className="flex flex-col items-center gap-4 p-8">
        <p className="text-sm text-muted-foreground">
          신고를 찾을 수 없습니다.
        </p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          돌아가기
        </Button>
      </div>
    );
  }

  const report = data.report as Record<string, unknown>;
  const targetContent = data.targetContent as Record<string, unknown> | null;
  const reporter = report.reporter as Record<string, unknown> | null;
  const targetUser = report.target_user as Record<string, unknown> | null;
  const status = report.status as string;
  const isProcessed = status === "resolved" || status === "dismissed";

  const handleResolve = async (resolveStatus: "resolved" | "dismissed") => {
    const result = await resolveMutation.mutateAsync({
      reportId: id,
      status: resolveStatus,
      adminNote: adminNote.trim() || undefined,
    });

    if (result.error) {
      toast({
        title: "처리 실패",
        description: result.error,
        variant: "destructive",
      });
      return;
    }

    toast({
      title:
        resolveStatus === "resolved"
          ? "신고가 처리되었습니다."
          : "신고가 기각되었습니다.",
    });
    router.push("/admin/reports");
  };

  const handleIssuePenalty = async () => {
    if (!penaltyReason.trim()) {
      toast({
        title: "페널티 사유를 입력해주세요",
        variant: "destructive",
      });
      return;
    }

    const result = await issuePenaltyMutation.mutateAsync({
      userId: report.target_user_id as string,
      type: penaltyType,
      reason: penaltyReason.trim(),
      reportId: id,
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
    router.push("/admin/reports");
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.push("/admin/reports")}
          className="rounded-full p-1 hover:bg-muted"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold">신고 상세</h1>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-medium",
            STATUS_BADGE[status]
          )}
        >
          {STATUS_LABEL[status]}
        </span>
      </div>

      {/* 신고 정보 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">신고 정보</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">신고자</span>
            <span>{(reporter?.nickname as string) ?? "알 수 없음"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">대상 사용자</span>
            <span>{(targetUser?.nickname as string) ?? "알 수 없음"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">대상 유형</span>
            <span>
              {TARGET_LABEL[report.target_type as string] ??
                (report.target_type as string)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">신고 사유</span>
            <span>
              {REASON_LABEL[report.reason as string] ??
                (report.reason as string)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">접수일</span>
            <span>
              {new Date(report.created_at as string).toLocaleDateString(
                "ko-KR"
              )}
            </span>
          </div>
          {report.description && (
            <div className="mt-2 rounded-md bg-accent/30 p-2.5">
              <p className="text-[10px] text-muted-foreground">상세 설명</p>
              <p className="mt-1">{report.description as string}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 대상 콘텐츠 미리보기 */}
      {targetContent && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">대상 콘텐츠</CardTitle>
          </CardHeader>
          <CardContent className="text-xs">
            {(report.target_type as string) === "post" && (
              <div className="flex flex-col gap-1">
                <p className="font-medium">
                  {targetContent.title as string}
                </p>
                <p className="text-muted-foreground line-clamp-3">
                  {targetContent.content as string}
                </p>
              </div>
            )}
            {(report.target_type as string) === "comment" && (
              <p className="text-muted-foreground">
                {targetContent.content as string}
              </p>
            )}
            {(report.target_type as string) === "bid" && (
              <div className="flex flex-col gap-1">
                <p>
                  금액:{" "}
                  {(
                    targetContent.total_price as number
                  )?.toLocaleString()}
                  원
                </p>
                {targetContent.message && (
                  <p className="text-muted-foreground">
                    {targetContent.message as string}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 처리 영역 */}
      {!isProcessed && (
        <>
          {/* 관리자 메모 */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">
              관리자 메모 (선택)
            </label>
            <Input
              placeholder="처리 관련 메모를 입력하세요"
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
            />
          </div>

          {/* 처리 버튼 */}
          <div className="flex gap-2">
            <Button
              className="flex-1"
              size="sm"
              onClick={() => handleResolve("resolved")}
              disabled={resolveMutation.isPending}
            >
              <CheckCircle className="mr-1 h-3.5 w-3.5" />
              처리 완료
            </Button>
            <Button
              className="flex-1"
              size="sm"
              variant="outline"
              onClick={() => handleResolve("dismissed")}
              disabled={resolveMutation.isPending}
            >
              <XCircle className="mr-1 h-3.5 w-3.5" />
              기각
            </Button>
          </div>

          {/* 페널티 부여 */}
          {!showPenaltyForm ? (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowPenaltyForm(true)}
            >
              <AlertTriangle className="mr-1 h-3.5 w-3.5" />
              페널티 부여
            </Button>
          ) : (
            <Card className="border-destructive/30">
              <CardContent className="flex flex-col gap-3 p-4">
                <h4 className="text-sm font-semibold">페널티 부여</h4>
                <div className="flex gap-2">
                  {(["warning", "suspension"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setPenaltyType(t)}
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                        penaltyType === t
                          ? "bg-destructive text-destructive-foreground"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {t === "warning" ? "경고" : "이용정지"}
                    </button>
                  ))}
                </div>
                <Input
                  placeholder="페널티 사유를 입력하세요"
                  value={penaltyReason}
                  onChange={(e) => setPenaltyReason(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    size="sm"
                    variant="destructive"
                    onClick={handleIssuePenalty}
                    disabled={issuePenaltyMutation.isPending}
                  >
                    {issuePenaltyMutation.isPending
                      ? "처리 중..."
                      : "페널티 부여"}
                  </Button>
                  <Button
                    className="flex-1"
                    size="sm"
                    variant="outline"
                    onClick={() => setShowPenaltyForm(false)}
                  >
                    취소
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* 처리 완료 정보 */}
      {isProcessed && report.admin_note && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">관리자 메모</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {report.admin_note as string}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
