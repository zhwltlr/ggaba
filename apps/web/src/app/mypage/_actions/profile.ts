"use server";

import { createClient } from "@/lib/supabase/server";

export async function getProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { profile: null, error: "로그인이 필요합니다." };
  }

  const { data: profile, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    return { profile: null, error: error.message };
  }

  return { profile, error: null };
}

export async function updateProfile(input: {
  nickname?: string;
  profileImageUrl?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const updates: Record<string, unknown> = {};
  if (input.nickname) updates.nickname = input.nickname;
  if (input.profileImageUrl !== undefined)
    updates.profile_image_url = input.profileImageUrl;

  const { error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

export async function updateUserMode(mode: "consumer" | "contractor") {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const { error } = await supabase
    .from("users")
    .update({ user_mode: mode })
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

export async function getMyPosts() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { posts: [], error: "로그인이 필요합니다." };
  }

  const { data, error } = await supabase
    .from("community_posts")
    .select("id, title, type, view_count, like_count, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    return { posts: [], error: error.message };
  }

  return { posts: data ?? [], error: null };
}

export async function getMyComments() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { comments: [], error: "로그인이 필요합니다." };
  }

  const { data, error } = await supabase
    .from("comments")
    .select("id, content, created_at, community_posts!inner(id, title)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    return { comments: [], error: error.message };
  }

  return { comments: data ?? [], error: null };
}
