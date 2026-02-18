"use server";

import { createClient } from "@/lib/supabase/server";
import type { BidItem } from "../_types";

export async function getBidsForAuction(auctionId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { bids: [], error: "로그인이 필요합니다." };
  }

  // 경매 소유자 검증
  const { data: auction, error: auctionError } = await supabase
    .from("auctions")
    .select("id, user_id, status, deadline_at")
    .eq("id", auctionId)
    .single();

  if (auctionError || !auction) {
    return { bids: [], error: "경매를 찾을 수 없습니다." };
  }

  if (auction.user_id !== user.id) {
    return { bids: [], error: "접근 권한이 없습니다." };
  }

  // 입찰 조회 — contractor_id 제외 (블라인드)
  const { data: bidsData, error: bidsError } = await supabase
    .from("bids")
    .select("id, auction_id, total_price, message, status, created_at")
    .eq("auction_id", auctionId)
    .order("total_price", { ascending: true });

  if (bidsError) {
    return { bids: [], error: bidsError.message };
  }

  return {
    bids: (bidsData ?? []) as BidItem[],
    auctionStatus: auction.status,
    error: null,
  };
}
