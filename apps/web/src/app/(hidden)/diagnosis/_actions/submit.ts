"use server";

import { createClient } from "@/lib/supabase/server";
import type { ExtractedLineItem } from "@/stores/use-diagnosis-store";
import type { MaskingOptions, UserInput } from "@/stores/use-diagnosis-store";
import { getPriceRating, calculateBadPriceScore } from "@/lib/mock-ocr";

interface SubmitDiagnosisInput {
  items: ExtractedLineItem[];
  userInput: UserInput;
  masking: MaskingOptions;
  imageUrls: string[];
}

export async function submitDiagnosis(input: SubmitDiagnosisInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const { items, userInput, masking, imageUrls } = input;

  // 전체 합계 및 바가지 점수 계산
  const totalPrice = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const badPriceScore = calculateBadPriceScore(items);

  // 항목별 분석 결과 생성
  const analyzedItems = items.map((item) => {
    const { rating, low, high } = getPriceRating(
      item.category,
      item.detail,
      item.unitPrice
    );
    return { ...item, priceRating: rating, marketPriceLow: low, marketPriceHigh: high };
  });

  // 분석 요약 생성
  const warnings: string[] = [];
  const overPricedItems = analyzedItems.filter(
    (i) => i.priceRating === "과다" || i.priceRating === "주의"
  );
  if (overPricedItems.length > 0) {
    overPricedItems.forEach((item) => {
      const diff = Math.round(
        ((item.unitPrice - item.marketPriceHigh) / item.marketPriceHigh) * 100
      );
      if (diff > 0) {
        warnings.push(
          `${item.category} - ${item.detail}: 시세 대비 ${diff}% 높음`
        );
      }
    });
  }

  // 카테고리 누락 체크
  const categories = new Set(items.map((i) => i.category));
  if (!categories.has("철거")) {
    warnings.push("철거 비용이 누락되었을 수 있습니다");
  }
  if (
    categories.has("욕실") &&
    !items.some((i) => i.detail.includes("방수"))
  ) {
    warnings.push("욕실 방수 공사가 누락되었을 수 있습니다");
  }

  const diagnosisResult = JSON.stringify({ warnings, analyzedItems });

  // estimates 테이블 INSERT
  const { data: estimate, error: estimateError } = await supabase
    .from("estimates")
    .insert({
      user_id: user.id,
      title: userInput.title || "견적 진단",
      status: "diagnosed",
      region: userInput.region,
      size_pyeong: userInput.sizePyeong,
      building_type: userInput.buildingType,
      total_price: totalPrice,
      bad_price_score: badPriceScore,
      diagnosis_result: diagnosisResult,
      original_file_url: imageUrls[0] ?? null,
      is_image_masked: masking.isImageMasked,
      is_text_masked: masking.isTextMasked,
    })
    .select("id")
    .single();

  if (estimateError) {
    return { error: `견적 저장 실패: ${estimateError.message}` };
  }

  // estimate_items 테이블 INSERT
  const itemRows = analyzedItems.map((item, index) => ({
    estimate_id: estimate.id,
    category: item.category,
    detail: item.detail,
    unit: item.unit,
    unit_price: item.unitPrice,
    quantity: item.quantity,
    total_price: item.totalPrice,
    sort_order: index,
    price_rating: item.priceRating,
    market_price_low: item.marketPriceLow,
    market_price_high: item.marketPriceHigh,
  }));

  const { error: itemsError } = await supabase
    .from("estimate_items")
    .insert(itemRows);

  if (itemsError) {
    return { error: `항목 저장 실패: ${itemsError.message}` };
  }

  return {
    estimateId: estimate.id,
    badPriceScore,
    totalPrice,
    warnings,
  };
}
