"use server";

import { createClient } from "@/lib/supabase/server";

const PAGE_SIZE = 10;

export interface ReviewItem {
  id: string;
  rating: number;
  content: string | null;
  image_urls: string[];
  created_at: string;
  nickname: string;
}

export async function createReview(input: {
  partnerId: string;
  auctionId?: string;
  rating: number;
  content: string;
  imageUrls?: string[];
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  // 중복 검증: 같은 시공사 + 같은 경매에 대해 이미 리뷰 존재하는지
  if (input.auctionId) {
    const { data: existing } = await supabase
      .from("reviews")
      .select("id")
      .eq("user_id", user.id)
      .eq("partner_id", input.partnerId)
      .eq("auction_id", input.auctionId)
      .maybeSingle();

    if (existing) {
      return { error: "이미 이 거래에 대한 리뷰를 작성하셨습니다." };
    }
  }

  const { error } = await supabase.from("reviews").insert({
    user_id: user.id,
    partner_id: input.partnerId,
    auction_id: input.auctionId ?? null,
    rating: input.rating,
    content: input.content,
    image_urls: JSON.stringify(input.imageUrls ?? []),
  });

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

export async function getContractorReviews(
  contractorId: string,
  opts: { cursor?: string } = {}
) {
  const supabase = await createClient();

  let query = supabase
    .from("reviews")
    .select(
      "id, rating, content, image_urls, created_at, users!reviews_user_id_fkey(nickname)"
    )
    .eq("partner_id", contractorId)
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE + 1);

  if (opts.cursor) {
    query = query.lt("created_at", opts.cursor);
  }

  const { data, error } = await query;

  if (error) {
    return { reviews: [], nextCursor: null, error: error.message };
  }

  const hasMore = (data?.length ?? 0) > PAGE_SIZE;
  const raw = (data ?? []).slice(0, PAGE_SIZE);

  const reviews: ReviewItem[] = raw.map((r) => {
    let imageUrls: string[] = [];
    try {
      imageUrls = r.image_urls ? JSON.parse(r.image_urls) : [];
    } catch {
      imageUrls = [];
    }

    return {
      id: r.id,
      rating: r.rating,
      content: r.content,
      image_urls: imageUrls,
      created_at: r.created_at,
      nickname: (r.users as unknown as { nickname: string })?.nickname ?? "익명",
    };
  });

  const nextCursor = hasMore
    ? reviews[reviews.length - 1]?.created_at
    : null;

  return { reviews, nextCursor, error: null };
}
