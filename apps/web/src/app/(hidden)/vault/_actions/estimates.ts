"use server";

import { createClient } from "@/lib/supabase/server";

export async function getMyEstimates() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { estimates: [], error: "로그인이 필요합니다." };
  }

  const { data, error } = await supabase
    .from("estimates")
    .select("id, title, status, region, size_pyeong, building_type, total_price, bad_price_score, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return { estimates: [], error: error.message };
  }

  return { estimates: data ?? [], error: null };
}
