"use server";

import { createClient } from "@/lib/supabase/server";

const PAGE_SIZE = 10;

export type PostType = "review" | "share" | "qna" | "contractor_tip" | "material_info";

export interface PostItem {
  id: string;
  type: PostType;
  title: string;
  content: string;
  image_urls: string | null;
  view_count: number;
  like_count: number;
  created_at: string;
  user_id: string;
  estimate_id: string | null;
  // joined
  nickname: string;
  profile_image_url: string | null;
  user_mode: "consumer" | "contractor";
  comment_count: number;
  // estimate info (if linked)
  estimate_region: string | null;
  estimate_size: string | null;
  estimate_score: number | null;
}

export async function getPosts(opts: {
  type?: PostType;
  cursor?: string;
}) {
  const supabase = await createClient();
  const { type, cursor } = opts;

  let query = supabase
    .from("community_posts")
    .select(
      `
      id, type, title, content, image_urls, view_count, like_count, created_at, user_id, estimate_id,
      users!inner(nickname, profile_image_url, user_mode),
      estimates(region, size_pyeong, bad_price_score)
    `
    )
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE + 1);

  if (type) {
    query = query.eq("type", type);
  }

  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  const { data, error } = await query;

  if (error) {
    return { posts: [], nextCursor: null, error: error.message };
  }

  const hasMore = (data?.length ?? 0) > PAGE_SIZE;
  const posts = (data ?? []).slice(0, PAGE_SIZE);

  // comment count를 별도로 조회 (Supabase에서 count aggregate가 join에서 제한적)
  const postIds = posts.map((p: Record<string, unknown>) => p.id as string);
  const { data: commentCounts } = await supabase
    .from("comments")
    .select("post_id")
    .in("post_id", postIds);

  const countMap: Record<string, number> = {};
  (commentCounts ?? []).forEach((c: Record<string, unknown>) => {
    const pid = c.post_id as string;
    countMap[pid] = (countMap[pid] || 0) + 1;
  });

  const result: PostItem[] = posts.map((p: Record<string, unknown>) => {
    const user = p.users as Record<string, unknown> | null;
    const estimate = p.estimates as Record<string, unknown> | null;
    return {
      id: p.id as string,
      type: p.type as PostType,
      title: p.title as string,
      content: p.content as string,
      image_urls: p.image_urls as string | null,
      view_count: p.view_count as number,
      like_count: p.like_count as number,
      created_at: p.created_at as string,
      user_id: p.user_id as string,
      estimate_id: p.estimate_id as string | null,
      nickname: (user?.nickname as string) ?? "사용자",
      profile_image_url: (user?.profile_image_url as string) ?? null,
      user_mode: ((user?.user_mode as string) ?? "consumer") as "consumer" | "contractor",
      comment_count: countMap[p.id as string] || 0,
      estimate_region: (estimate?.region as string) ?? null,
      estimate_size: estimate?.size_pyeong ? String(estimate.size_pyeong) : null,
      estimate_score: (estimate?.bad_price_score as number) ?? null,
    };
  });

  const nextCursor = hasMore
    ? (posts[posts.length - 1] as Record<string, unknown>)?.created_at as string
    : null;

  return { posts: result, nextCursor, error: null };
}

export async function getPost(id: string) {
  const supabase = await createClient();

  // view_count 증가 (raw SQL 대신 select 후 update)
  const { data: current } = await supabase
    .from("community_posts")
    .select("view_count")
    .eq("id", id)
    .single();

  if (current) {
    await supabase
      .from("community_posts")
      .update({ view_count: (current.view_count ?? 0) + 1 })
      .eq("id", id);
  }

  const { data: post, error } = await supabase
    .from("community_posts")
    .select(
      `
      *,
      users!inner(id, nickname, profile_image_url, user_mode),
      estimates(id, title, region, size_pyeong, bad_price_score, total_price,
        estimate_items(id, category, detail, unit, unit_price, quantity, total_price, price_rating, market_price_low, market_price_high, sort_order)
      )
    `
    )
    .eq("id", id)
    .single();

  if (error) {
    return { post: null, comments: [], error: error.message };
  }

  // 댓글 조회 (대댓글 포함)
  const { data: commentsData } = await supabase
    .from("comments")
    .select(
      `
      *,
      users!inner(nickname, profile_image_url)
    `
    )
    .eq("post_id", id)
    .order("created_at", { ascending: true });

  return { post, comments: commentsData ?? [], error: null };
}

export async function addComment(input: {
  postId: string;
  content: string;
  parentId?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const { data, error } = await supabase
    .from("comments")
    .insert({
      post_id: input.postId,
      user_id: user.id,
      content: input.content,
      parent_id: input.parentId ?? null,
    })
    .select("*, users!inner(nickname, profile_image_url)")
    .single();

  if (error) {
    return { comment: null, error: error.message };
  }

  return { comment: data, error: null };
}

export async function createPost(input: {
  type: PostType;
  title: string;
  content: string;
  estimateId?: string;
  isPriceMasked?: boolean;
  isImageMasked?: boolean;
  imageUrls?: string[];
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const { data, error } = await supabase
    .from("community_posts")
    .insert({
      user_id: user.id,
      type: input.type,
      title: input.title,
      content: input.content,
      estimate_id: input.estimateId ?? null,
      is_price_masked: input.isPriceMasked ?? false,
      is_image_masked: input.isImageMasked ?? false,
      image_urls: input.imageUrls ? JSON.stringify(input.imageUrls) : null,
    })
    .select("id")
    .single();

  if (error) {
    return { postId: null, error: error.message };
  }

  return { postId: data.id, error: null };
}
