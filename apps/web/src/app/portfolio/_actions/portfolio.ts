"use server";

import { createClient } from "@/lib/supabase/server";
import type { PortfolioItem, PortfolioInput } from "../_types";

const PAGE_SIZE = 10;

function parseImages(json: string | null): string[] {
  if (!json) return [];
  try {
    return JSON.parse(json);
  } catch {
    return [];
  }
}

function toPortfolioItem(row: Record<string, unknown>): PortfolioItem {
  return {
    id: row.id as string,
    contractor_id: row.contractor_id as string,
    title: row.title as string,
    description: row.description as string | null,
    region: row.region as string | null,
    size_pyeong: row.size_pyeong as number | null,
    duration_days: row.duration_days as number | null,
    total_cost: row.total_cost as number | null,
    before_image_urls: parseImages(row.before_image_urls as string | null),
    after_image_urls: parseImages(row.after_image_urls as string | null),
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export async function getMyPortfolios(opts: { cursor?: string }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { portfolios: [], nextCursor: null, error: "로그인이 필요합니다." };
  }

  let query = supabase
    .from("portfolios")
    .select(
      "id, contractor_id, title, description, region, size_pyeong, duration_days, total_cost, before_image_urls, after_image_urls, created_at, updated_at"
    )
    .eq("contractor_id", user.id)
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE + 1);

  if (opts.cursor) {
    query = query.lt("created_at", opts.cursor);
  }

  const { data, error } = await query;

  if (error) {
    return { portfolios: [], nextCursor: null, error: error.message };
  }

  const hasMore = (data?.length ?? 0) > PAGE_SIZE;
  const raw = (data ?? []).slice(0, PAGE_SIZE);
  const portfolios = raw.map(toPortfolioItem);

  const nextCursor = hasMore
    ? portfolios[portfolios.length - 1]?.created_at
    : null;

  return { portfolios, nextCursor, error: null };
}

export async function getPortfolio(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("portfolios")
    .select(
      "id, contractor_id, title, description, region, size_pyeong, duration_days, total_cost, before_image_urls, after_image_urls, created_at, updated_at"
    )
    .eq("id", id)
    .single();

  if (error) {
    return { portfolio: null, error: error.message };
  }

  return { portfolio: toPortfolioItem(data), error: null };
}

export async function getPortfoliosByContractor(
  contractorId: string,
  opts: { cursor?: string } = {}
) {
  const supabase = await createClient();

  let query = supabase
    .from("portfolios")
    .select(
      "id, contractor_id, title, description, region, size_pyeong, duration_days, total_cost, before_image_urls, after_image_urls, created_at, updated_at"
    )
    .eq("contractor_id", contractorId)
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE + 1);

  if (opts.cursor) {
    query = query.lt("created_at", opts.cursor);
  }

  const { data, error } = await query;

  if (error) {
    return { portfolios: [], nextCursor: null, error: error.message };
  }

  const hasMore = (data?.length ?? 0) > PAGE_SIZE;
  const raw = (data ?? []).slice(0, PAGE_SIZE);
  const portfolios = raw.map(toPortfolioItem);

  const nextCursor = hasMore
    ? portfolios[portfolios.length - 1]?.created_at
    : null;

  return { portfolios, nextCursor, error: null };
}

export async function createPortfolio(input: PortfolioInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { portfolioId: null, error: "로그인이 필요합니다." };
  }

  const { data, error } = await supabase
    .from("portfolios")
    .insert({
      contractor_id: user.id,
      title: input.title,
      description: input.description ?? null,
      region: input.region ?? null,
      size_pyeong: input.sizePyeong ?? null,
      duration_days: input.durationDays ?? null,
      total_cost: input.totalCost ?? null,
      before_image_urls: JSON.stringify(input.beforeImageUrls ?? []),
      after_image_urls: JSON.stringify(input.afterImageUrls ?? []),
    })
    .select("id")
    .single();

  if (error) {
    return { portfolioId: null, error: error.message };
  }

  return { portfolioId: data.id as string, error: null };
}

export async function updatePortfolio(id: string, input: PortfolioInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  // 소유자 확인
  const { data: existing } = await supabase
    .from("portfolios")
    .select("contractor_id")
    .eq("id", id)
    .single();

  if (!existing || existing.contractor_id !== user.id) {
    return { error: "수정 권한이 없습니다." };
  }

  const { error } = await supabase
    .from("portfolios")
    .update({
      title: input.title,
      description: input.description ?? null,
      region: input.region ?? null,
      size_pyeong: input.sizePyeong ?? null,
      duration_days: input.durationDays ?? null,
      total_cost: input.totalCost ?? null,
      before_image_urls: JSON.stringify(input.beforeImageUrls ?? []),
      after_image_urls: JSON.stringify(input.afterImageUrls ?? []),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

export async function deletePortfolio(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  // 소유자 확인
  const { data: existing } = await supabase
    .from("portfolios")
    .select("contractor_id")
    .eq("id", id)
    .single();

  if (!existing || existing.contractor_id !== user.id) {
    return { error: "삭제 권한이 없습니다." };
  }

  const { error } = await supabase.from("portfolios").delete().eq("id", id);

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}
