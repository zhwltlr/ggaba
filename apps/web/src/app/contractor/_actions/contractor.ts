"use server";

import { createClient } from "@/lib/supabase/server";

export interface ContractorProfile {
  id: string;
  nickname: string;
  profile_image_url: string | null;
  created_at: string;
  company_name: string | null;
  specialty: string[];
  service_regions: string[];
  verified: boolean;
  avg_rating: number;
  review_count: number;
  portfolio_count: number;
}

function parseJson(json: string | null): string[] {
  if (!json) return [];
  try {
    return JSON.parse(json);
  } catch {
    return [];
  }
}

export async function getContractorProfile(
  contractorId: string
): Promise<{ profile: ContractorProfile | null; error: string | null }> {
  const supabase = await createClient();

  // 4개 쿼리 모두 contractorId만 필요하므로 병렬 실행
  const [userResult, businessResult, reviewsResult, portfolioResult] =
    await Promise.all([
      supabase
        .from("users")
        .select("id, nickname, profile_image_url, created_at")
        .eq("id", contractorId)
        .single(),
      supabase
        .from("business_profiles")
        .select("company_name, specialty, service_regions, verified")
        .eq("user_id", contractorId)
        .single(),
      supabase
        .from("reviews")
        .select("rating")
        .eq("partner_id", contractorId),
      supabase
        .from("portfolios")
        .select("id", { count: "exact", head: true })
        .eq("contractor_id", contractorId),
    ]);

  const user = userResult.data;
  if (userResult.error || !user) {
    return { profile: null, error: "시공사를 찾을 수 없습니다." };
  }

  const business = businessResult.data;
  const reviews = reviewsResult.data;
  const reviewCount = reviews?.length ?? 0;
  const avgRating =
    reviewCount > 0
      ? Math.round(
          ((reviews ?? []).reduce((sum, r) => sum + r.rating, 0) / reviewCount) *
            10
        ) / 10
      : 0;

  return {
    profile: {
      id: user.id,
      nickname: user.nickname,
      profile_image_url: user.profile_image_url,
      created_at: user.created_at,
      company_name: business?.company_name ?? null,
      specialty: parseJson(business?.specialty ?? null),
      service_regions: parseJson(business?.service_regions ?? null),
      verified: business?.verified ?? false,
      avg_rating: avgRating,
      review_count: reviewCount,
      portfolio_count: portfolioResult.count ?? 0,
    },
    error: null,
  };
}
