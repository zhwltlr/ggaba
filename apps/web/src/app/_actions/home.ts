"use server";

import { createClient } from "@/lib/supabase/server";

export async function getAuctionSummary() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { activeAuctions: 0, totalBids: 0 };
  }

  const [activeResult, bidsResult] = await Promise.all([
    // 내 활성 경매 수 (open 또는 bidding 상태)
    supabase
      .from("auctions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .in("status", ["open", "bidding"]),
    // 내 경매에 들어온 총 입찰 수
    supabase
      .from("auctions")
      .select("bid_count")
      .eq("user_id", user.id),
  ]);

  const totalBids =
    bidsResult.data?.reduce((sum, a) => sum + (a.bid_count ?? 0), 0) ?? 0;

  return {
    activeAuctions: activeResult.count ?? 0,
    totalBids,
  };
}
