"use server";

import { createClient } from "@/lib/supabase/server";

interface RegisterContractorInput {
  companyName: string;
  businessNumber: string;
  representativeName: string;
  phone: string;
  specialty: string[];
  serviceRegions: string[];
}

export async function registerContractor(input: RegisterContractorInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  // business_profiles 테이블에 INSERT
  const { data: profile, error: insertError } = await supabase
    .from("business_profiles")
    .insert({
      user_id: user.id,
      company_name: input.companyName,
      business_number: input.businessNumber,
      representative_name: input.representativeName,
      phone: input.phone,
      specialty: input.specialty.join(","),
      service_regions: input.serviceRegions.join(","),
    })
    .select("id")
    .single();

  if (insertError) {
    return { error: insertError.message };
  }

  // users 테이블 업데이트: business_profile_id + user_mode
  const { error: updateError } = await supabase
    .from("users")
    .update({
      business_profile_id: profile.id,
      user_mode: "contractor",
    })
    .eq("id", user.id);

  if (updateError) {
    return { error: updateError.message };
  }

  return { businessProfileId: profile.id, error: null };
}
