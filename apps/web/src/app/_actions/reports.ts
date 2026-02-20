"use server";

import { createClient } from "@/lib/supabase/server";

export type ReportTargetType = "post" | "comment" | "bid";
export type ReportReason =
  | "fake_bid"
  | "inappropriate"
  | "spam"
  | "false_info"
  | "harassment"
  | "other";

const TARGET_TABLE_MAP: Record<ReportTargetType, string> = {
  post: "community_posts",
  comment: "comments",
  bid: "bids",
};

const TARGET_USER_FIELD_MAP: Record<ReportTargetType, string> = {
  post: "user_id",
  comment: "user_id",
  bid: "contractor_id",
};

export async function submitReport(input: {
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  description?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "로그인이 필요합니다." };
  }

  // 대상 존재 확인 및 작성자 ID 조회
  const tableName = TARGET_TABLE_MAP[input.targetType];
  const userField = TARGET_USER_FIELD_MAP[input.targetType];

  const { data: target, error: targetError } = await supabase
    .from(tableName)
    .select(`id, ${userField}`)
    .eq("id", input.targetId)
    .single();

  if (targetError || !target) {
    return { success: false, error: "신고 대상을 찾을 수 없습니다." };
  }

  const targetUserId = (target as unknown as Record<string, unknown>)[userField] as string;

  // 자기 자신 신고 방지
  if (targetUserId === user.id) {
    return { success: false, error: "자신의 콘텐츠는 신고할 수 없습니다." };
  }

  // 중복 신고 방지
  const { data: existing } = await supabase
    .from("reports")
    .select("id")
    .eq("reporter_id", user.id)
    .eq("target_type", input.targetType)
    .eq("target_id", input.targetId)
    .limit(1);

  if (existing && existing.length > 0) {
    return { success: false, error: "이미 신고한 콘텐츠입니다." };
  }

  // 신고 등록
  const { error: insertError } = await supabase.from("reports").insert({
    reporter_id: user.id,
    target_type: input.targetType,
    target_id: input.targetId,
    target_user_id: targetUserId,
    reason: input.reason,
    description: input.description ?? null,
  });

  if (insertError) {
    return { success: false, error: insertError.message };
  }

  return { success: true, error: null };
}
