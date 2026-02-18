"use server";

import { createClient } from "@/lib/supabase/server";
import type { OpenAuctionItem, BidItemInput, MyBidItem, BidStatus } from "../_types";

const PAGE_SIZE = 10;

export async function getOpenAuctions(opts: {
  cursor?: string;
  region?: string;
  sizeMin?: number;
  sizeMax?: number;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { auctions: [], nextCursor: null, error: "로그인이 필요합니다." };
  }

  const { cursor, region, sizeMin, sizeMax } = opts;

  // 공개된 경매 조회 (open/bidding + 마감 전)
  let query = supabase
    .from("auctions")
    .select(
      "id, title, region, size_pyeong, budget_min, budget_max, schedule, description, status, bid_count, deadline_at, created_at"
    )
    .in("status", ["open", "bidding"])
    .gt("deadline_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE + 1);

  if (region) {
    query = query.eq("region", region);
  }
  if (sizeMin !== undefined) {
    query = query.gte("size_pyeong", sizeMin);
  }
  if (sizeMax !== undefined) {
    query = query.lte("size_pyeong", sizeMax);
  }
  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  const { data, error } = await query;

  if (error) {
    return { auctions: [], nextCursor: null, error: error.message };
  }

  const hasMore = (data?.length ?? 0) > PAGE_SIZE;
  const rawAuctions = (data ?? []).slice(0, PAGE_SIZE);

  // 내가 이미 입찰한 경매 확인
  const auctionIds = rawAuctions.map((a) => a.id);
  let myBidsMap: Record<string, BidStatus> = {};

  if (auctionIds.length > 0) {
    const { data: myBids } = await supabase
      .from("bids")
      .select("auction_id, status")
      .eq("contractor_id", user.id)
      .in("auction_id", auctionIds);

    if (myBids) {
      myBidsMap = Object.fromEntries(
        myBids.map((b) => [b.auction_id, b.status as BidStatus])
      );
    }
  }

  const auctions: OpenAuctionItem[] = rawAuctions.map((a) => ({
    ...(a as Omit<OpenAuctionItem, "my_bid_status">),
    my_bid_status: myBidsMap[a.id] ?? null,
  }));

  const nextCursor = hasMore
    ? auctions[auctions.length - 1]?.created_at
    : null;

  return { auctions, nextCursor, error: null };
}

export async function getOpenAuctionDetail(auctionId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { auction: null, myBidStatus: null, error: "로그인이 필요합니다." };
  }

  const { data: auction, error } = await supabase
    .from("auctions")
    .select(
      "id, title, region, size_pyeong, budget_min, budget_max, schedule, description, status, bid_count, deadline_at, created_at"
    )
    .eq("id", auctionId)
    .single();

  if (error) {
    return { auction: null, myBidStatus: null, error: error.message };
  }

  // 내 입찰 존재 여부 확인
  const { data: myBid } = await supabase
    .from("bids")
    .select("status")
    .eq("auction_id", auctionId)
    .eq("contractor_id", user.id)
    .maybeSingle();

  return {
    auction: auction as Omit<OpenAuctionItem, "my_bid_status">,
    myBidStatus: (myBid?.status as BidStatus) ?? null,
    error: null,
  };
}

export async function submitBid(input: {
  auctionId: string;
  totalPrice: number;
  message?: string;
  items: BidItemInput[];
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  // 경매 상태 확인
  const { data: auction } = await supabase
    .from("auctions")
    .select("id, status, deadline_at")
    .eq("id", input.auctionId)
    .single();

  if (!auction) {
    return { error: "경매를 찾을 수 없습니다." };
  }

  if (auction.status !== "open" && auction.status !== "bidding") {
    return { error: "입찰할 수 없는 상태의 경매입니다." };
  }

  if (auction.deadline_at && new Date(auction.deadline_at) < new Date()) {
    return { error: "입찰 마감 시간이 지났습니다." };
  }

  // 입찰 INSERT
  const { data: bid, error: bidError } = await supabase
    .from("bids")
    .insert({
      auction_id: input.auctionId,
      contractor_id: user.id,
      total_price: input.totalPrice,
      message: input.message ?? null,
    })
    .select("id")
    .single();

  if (bidError) {
    if (bidError.code === "23505") {
      return { error: "이미 이 경매에 입찰하셨습니다." };
    }
    return { error: bidError.message };
  }

  // bid_items 일괄 INSERT
  if (input.items.length > 0) {
    const bidItems = input.items.map((item, index) => ({
      bid_id: bid.id,
      category: item.category,
      detail: item.detail,
      unit: item.unit,
      unit_price: item.unitPrice,
      quantity: item.quantity,
      total_price: Math.round(item.unitPrice * item.quantity),
      sort_order: index,
    }));

    const { error: itemsError } = await supabase
      .from("bid_items")
      .insert(bidItems);

    if (itemsError) {
      return { error: itemsError.message };
    }
  }

  // bid_count + 1, status → 'bidding'
  const { data: currentAuction } = await supabase
    .from("auctions")
    .select("bid_count")
    .eq("id", input.auctionId)
    .single();

  await supabase
    .from("auctions")
    .update({
      bid_count: (currentAuction?.bid_count ?? 0) + 1,
      status: "bidding",
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.auctionId)
    .in("status", ["open", "bidding"]);

  return { error: null };
}

export async function getMyBids(opts: {
  status?: BidStatus;
  cursor?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { bids: [], nextCursor: null, error: "로그인이 필요합니다." };
  }

  const { status, cursor } = opts;

  let query = supabase
    .from("bids")
    .select(
      "id, auction_id, total_price, message, status, created_at, auctions(title, region, size_pyeong, status)"
    )
    .eq("contractor_id", user.id)
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
    return { bids: [], nextCursor: null, error: error.message };
  }

  const hasMore = (data?.length ?? 0) > PAGE_SIZE;
  const raw = (data ?? []).slice(0, PAGE_SIZE);

  const bids: MyBidItem[] = raw.map((b) => ({
    id: b.id,
    auction_id: b.auction_id,
    total_price: b.total_price,
    message: b.message,
    status: b.status as BidStatus,
    created_at: b.created_at,
    auction: b.auctions as unknown as MyBidItem["auction"],
  }));

  const nextCursor = hasMore ? bids[bids.length - 1]?.created_at : null;

  return { bids, nextCursor, error: null };
}
