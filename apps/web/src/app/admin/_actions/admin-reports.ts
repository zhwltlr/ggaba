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

export type ReportStatus = "pending" | "reviewing" | "resolved" | "dismissed";

export interface ReportItem {
  id: string;
  reporter_id: string;
  target_type: string;
  target_id: string;
  target_user_id: string;
  reason: string;
  description: string | null;
  status: ReportStatus;
  admin_note: string | null;
  resolved_at: string | null;
  created_at: string;
  reporter_nickname: string;
  target_user_nickname: string;
}

export async function getReports(opts: {
  status?: ReportStatus;
  cursor?: string;
}) {
  const { supabase, error: authError } = await requireAdmin();
  if (authError || !supabase) {
    return { reports: [], nextCursor: null, error: authError };
  }

  const { status, cursor } = opts;

  let query = supabase
    .from("reports")
    .select(
      `
      id, reporter_id, target_type, target_id, target_user_id,
      reason, description, status, admin_note, resolved_at, created_at,
      reporter:users!reports_reporter_id_fkey(nickname),
      target_user:users!reports_target_user_id_fkey(nickname)
    `
    )
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE + 1);

  if (status) {
    query = query.eq("status", status);
  }

  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  const { data, error } = await query;

  if (error) {
    return { reports: [], nextCursor: null, error: error.message };
  }

  const hasMore = (data?.length ?? 0) > PAGE_SIZE;
  const items = (data ?? []).slice(0, PAGE_SIZE);

  const reports: ReportItem[] = items.map((r: Record<string, unknown>) => {
    const reporter = r.reporter as Record<string, unknown> | null;
    const targetUser = r.target_user as Record<string, unknown> | null;
    return {
      id: r.id as string,
      reporter_id: r.reporter_id as string,
      target_type: r.target_type as string,
      target_id: r.target_id as string,
      target_user_id: r.target_user_id as string,
      reason: r.reason as string,
      description: r.description as string | null,
      status: r.status as ReportStatus,
      admin_note: r.admin_note as string | null,
      resolved_at: r.resolved_at as string | null,
      created_at: r.created_at as string,
      reporter_nickname: (reporter?.nickname as string) ?? "알 수 없음",
      target_user_nickname: (targetUser?.nickname as string) ?? "알 수 없음",
    };
  });

  const nextCursor = hasMore
    ? (items[items.length - 1] as Record<string, unknown>)?.created_at as string
    : null;

  return { reports, nextCursor, error: null };
}

export async function getReportDetail(id: string) {
  const { supabase, error: authError } = await requireAdmin();
  if (authError || !supabase) {
    return { report: null, error: authError };
  }

  const { data, error } = await supabase
    .from("reports")
    .select(
      `
      *,
      reporter:users!reports_reporter_id_fkey(id, nickname, email),
      target_user:users!reports_target_user_id_fkey(id, nickname, email)
    `
    )
    .eq("id", id)
    .single();

  if (error) {
    return { report: null, error: error.message };
  }

  // 대상 콘텐츠 미리보기 조회
  let targetContent: Record<string, unknown> | null = null;
  const targetType = data.target_type as string;
  const targetId = data.target_id as string;

  if (targetType === "post") {
    const { data: post } = await supabase
      .from("community_posts")
      .select("id, title, content, type")
      .eq("id", targetId)
      .single();
    targetContent = post;
  } else if (targetType === "comment") {
    const { data: comment } = await supabase
      .from("comments")
      .select("id, content, post_id")
      .eq("id", targetId)
      .single();
    targetContent = comment;
  } else if (targetType === "bid") {
    const { data: bid } = await supabase
      .from("bids")
      .select("id, total_price, message, status")
      .eq("id", targetId)
      .single();
    targetContent = bid;
  }

  return { report: data, targetContent, error: null };
}

export async function resolveReport(input: {
  reportId: string;
  status: "resolved" | "dismissed";
  adminNote?: string;
}) {
  const { supabase, user, error: authError } = await requireAdmin();
  if (authError || !supabase || !user) {
    return { success: false, error: authError };
  }

  const { error } = await supabase
    .from("reports")
    .update({
      status: input.status,
      admin_note: input.adminNote ?? null,
      resolved_at: new Date().toISOString(),
      resolved_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.reportId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
}

export async function updateReportStatus(input: {
  reportId: string;
  status: ReportStatus;
}) {
  const { supabase, error: authError } = await requireAdmin();
  if (authError || !supabase) {
    return { success: false, error: authError };
  }

  const { error } = await supabase
    .from("reports")
    .update({
      status: input.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.reportId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
}

export async function getPendingReportCount() {
  const { supabase, error: authError } = await requireAdmin();
  if (authError || !supabase) {
    return { count: 0, error: authError };
  }

  const { count, error } = await supabase
    .from("reports")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");

  if (error) {
    return { count: 0, error: error.message };
  }

  return { count: count ?? 0, error: null };
}
