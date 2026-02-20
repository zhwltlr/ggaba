"use server";

import { createClient } from "@/lib/supabase/server";

const PAGE_SIZE = 20;

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase: null, user: null, error: "로그인이 필요합니다." };
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return { supabase: null, user: null, error: "관리자 권한이 필요합니다." };
  }

  return { supabase, user, error: null };
}

export type PenaltyType = "warning" | "suspension";
export type PenaltyFilter = "all" | "active" | "expired";

export interface PenaltyItem {
  id: string;
  user_id: string;
  type: PenaltyType;
  reason: string;
  report_id: string | null;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
  user_nickname: string;
  user_email: string;
  created_by_nickname: string;
}

export async function getPenalties(opts: {
  filter?: PenaltyFilter;
  cursor?: string;
}) {
  const { supabase, error: authError } = await requireAdmin();
  if (authError || !supabase) {
    return { penalties: [], nextCursor: null, error: authError };
  }

  const { filter, cursor } = opts;

  let query = supabase
    .from("penalties")
    .select(
      `
      id, user_id, type, reason, report_id, is_active, expires_at, created_at,
      user:users!penalties_user_id_fkey(nickname, email),
      creator:users!penalties_created_by_fkey(nickname)
    `
    )
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE + 1);

  if (filter === "active") {
    query = query.eq("is_active", true);
  } else if (filter === "expired") {
    query = query.eq("is_active", false);
  }

  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  const { data, error } = await query;

  if (error) {
    return { penalties: [], nextCursor: null, error: error.message };
  }

  const hasMore = (data?.length ?? 0) > PAGE_SIZE;
  const items = (data ?? []).slice(0, PAGE_SIZE);

  const penalties: PenaltyItem[] = items.map((p: Record<string, unknown>) => {
    const penaltyUser = p.user as Record<string, unknown> | null;
    const creator = p.creator as Record<string, unknown> | null;
    return {
      id: p.id as string,
      user_id: p.user_id as string,
      type: p.type as PenaltyType,
      reason: p.reason as string,
      report_id: p.report_id as string | null,
      is_active: p.is_active as boolean,
      expires_at: p.expires_at as string | null,
      created_at: p.created_at as string,
      user_nickname: (penaltyUser?.nickname as string) ?? "알 수 없음",
      user_email: (penaltyUser?.email as string) ?? "",
      created_by_nickname: (creator?.nickname as string) ?? "알 수 없음",
    };
  });

  const nextCursor = hasMore
    ? (items[items.length - 1] as Record<string, unknown>)?.created_at as string
    : null;

  return { penalties, nextCursor, error: null };
}

export async function issuePenalty(input: {
  userId: string;
  type: PenaltyType;
  reason: string;
  reportId?: string;
  expiresAt?: string;
}) {
  const { supabase, user, error: authError } = await requireAdmin();
  if (authError || !supabase || !user) {
    return { success: false, error: authError };
  }

  // 대상 사용자 존재 확인
  const { data: targetUser } = await supabase
    .from("users")
    .select("id")
    .eq("id", input.userId)
    .single();

  if (!targetUser) {
    return { success: false, error: "대상 사용자를 찾을 수 없습니다." };
  }

  const { error } = await supabase.from("penalties").insert({
    user_id: input.userId,
    type: input.type,
    reason: input.reason,
    report_id: input.reportId ?? null,
    expires_at: input.expiresAt ?? null,
    created_by: user.id,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  // 연결된 신고가 있으면 resolved로 업데이트
  if (input.reportId) {
    await supabase
      .from("reports")
      .update({
        status: "resolved",
        resolved_at: new Date().toISOString(),
        resolved_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.reportId);
  }

  return { success: true, error: null };
}

export async function revokePenalty(penaltyId: string) {
  const { supabase, error: authError } = await requireAdmin();
  if (authError || !supabase) {
    return { success: false, error: authError };
  }

  const { error } = await supabase
    .from("penalties")
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", penaltyId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
}
