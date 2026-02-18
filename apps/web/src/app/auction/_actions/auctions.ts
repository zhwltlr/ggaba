"use server";

import { createClient } from "@/lib/supabase/server";
import type { AuctionItem, AuctionDetail, AuctionStatus, BidItem } from "../_types";

const PAGE_SIZE = 10;

export async function createAuction(input: {
  title: string;
  region: string;
  sizePyeong: number;
  budgetMin?: number;
  budgetMax?: number;
  schedule?: string;
  description?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { auctionId: null, error: "로그인이 필요합니다." };
  }

  // deadline_at = 7일 후
  const deadlineAt = new Date();
  deadlineAt.setDate(deadlineAt.getDate() + 7);

  const { data, error } = await supabase
    .from("auctions")
    .insert({
      user_id: user.id,
      title: input.title,
      region: input.region,
      size_pyeong: input.sizePyeong,
      budget_min: input.budgetMin ?? null,
      budget_max: input.budgetMax ?? null,
      schedule: input.schedule ?? null,
      description: input.description ?? null,
      deadline_at: deadlineAt.toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    return { auctionId: null, error: error.message };
  }

  return { auctionId: data.id, error: null };
}

export async function getMyAuctions(opts: {
  status?: AuctionStatus;
  cursor?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { auctions: [], nextCursor: null, error: "로그인이 필요합니다." };
  }

  const { status, cursor } = opts;

  let query = supabase
    .from("auctions")
    .select(
      "id, title, region, size_pyeong, budget_min, budget_max, schedule, status, bid_count, deadline_at, created_at"
    )
    .eq("user_id", user.id)
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
    return { auctions: [], nextCursor: null, error: error.message };
  }

  const hasMore = (data?.length ?? 0) > PAGE_SIZE;
  const auctions: AuctionItem[] = (data ?? []).slice(0, PAGE_SIZE) as AuctionItem[];

  const nextCursor = hasMore
    ? auctions[auctions.length - 1]?.created_at
    : null;

  return { auctions, nextCursor, error: null };
}

export async function getAuctionDetail(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { auction: null, error: "로그인이 필요합니다." };
  }

  const { data: auction, error } = await supabase
    .from("auctions")
    .select(
      "id, user_id, title, region, size_pyeong, budget_min, budget_max, schedule, description, status, bid_count, deadline_at, created_at, updated_at"
    )
    .eq("id", id)
    .single();

  if (error) {
    return { auction: null, error: error.message };
  }

  // 소유자 검증
  if (auction.user_id !== user.id) {
    return { auction: null, error: "접근 권한이 없습니다." };
  }

  // 입찰 조회 — contractor_id 제외 (블라인드 경매)
  const { data: bidsData } = await supabase
    .from("bids")
    .select("id, auction_id, total_price, message, status, created_at")
    .eq("auction_id", id)
    .order("created_at", { ascending: true });

  const result: AuctionDetail = {
    ...(auction as Omit<AuctionDetail, "bids">),
    bids: (bidsData ?? []) as BidItem[],
  };

  return { auction: result, error: null };
}

export async function selectBid(input: { auctionId: string; bidId: string }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  // 경매 소유자 검증
  const { data: auction } = await supabase
    .from("auctions")
    .select("id, user_id, status")
    .eq("id", input.auctionId)
    .single();

  if (!auction || auction.user_id !== user.id) {
    return { error: "접근 권한이 없습니다." };
  }

  if (auction.status !== "open" && auction.status !== "bidding") {
    return { error: "입찰을 선택할 수 없는 상태입니다." };
  }

  // 선택된 입찰 → 'selected'
  const { error: selectError } = await supabase
    .from("bids")
    .update({ status: "selected", updated_at: new Date().toISOString() })
    .eq("id", input.bidId)
    .eq("auction_id", input.auctionId);

  if (selectError) {
    return { error: selectError.message };
  }

  // 나머지 입찰 → 'rejected'
  const { error: rejectError } = await supabase
    .from("bids")
    .update({ status: "rejected", updated_at: new Date().toISOString() })
    .eq("auction_id", input.auctionId)
    .neq("id", input.bidId)
    .eq("status", "submitted");

  if (rejectError) {
    return { error: rejectError.message };
  }

  // 경매 상태 → 'selected'
  const { error: auctionError } = await supabase
    .from("auctions")
    .update({ status: "selected", updated_at: new Date().toISOString() })
    .eq("id", input.auctionId);

  if (auctionError) {
    return { error: auctionError.message };
  }

  return { error: null };
}
