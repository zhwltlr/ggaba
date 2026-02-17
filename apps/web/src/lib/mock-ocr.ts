import type { ExtractedLineItem } from "@/stores/use-diagnosis-store";

/**
 * Mock OCR 함수 — Phase 1에서는 하드코딩된 견적 항목을 반환
 * 추후 실제 OCR API (Google Vision, CLOVA OCR 등)로 교체 예정
 */
export function mockOcrExtract(_imageUrls: string[]): ExtractedLineItem[] {
  return [
    // 철거 공사
    {
      id: crypto.randomUUID(),
      category: "철거",
      detail: "기존 내부 철거",
      unit: "식",
      unitPrice: 2800000,
      quantity: 1,
      totalPrice: 2800000,
      isEdited: false,
    },
    {
      id: crypto.randomUUID(),
      category: "철거",
      detail: "폐기물 처리",
      unit: "식",
      unitPrice: 800000,
      quantity: 1,
      totalPrice: 800000,
      isEdited: false,
    },
    // 목공사
    {
      id: crypto.randomUUID(),
      category: "목공사",
      detail: "천장 틀 작업",
      unit: "m²",
      unitPrice: 35000,
      quantity: 60,
      totalPrice: 2100000,
      isEdited: false,
    },
    {
      id: crypto.randomUUID(),
      category: "목공사",
      detail: "걸레받이",
      unit: "m",
      unitPrice: 12000,
      quantity: 45,
      totalPrice: 540000,
      isEdited: false,
    },
    // 도배
    {
      id: crypto.randomUUID(),
      category: "도배",
      detail: "실크벽지 도배",
      unit: "m²",
      unitPrice: 8500,
      quantity: 180,
      totalPrice: 1530000,
      isEdited: false,
    },
    // 바닥
    {
      id: crypto.randomUUID(),
      category: "바닥",
      detail: "강마루 시공",
      unit: "m²",
      unitPrice: 45000,
      quantity: 50,
      totalPrice: 2250000,
      isEdited: false,
    },
    // 욕실
    {
      id: crypto.randomUUID(),
      category: "욕실",
      detail: "타일 시공 (벽+바닥)",
      unit: "m²",
      unitPrice: 65000,
      quantity: 25,
      totalPrice: 1625000,
      isEdited: false,
    },
    {
      id: crypto.randomUUID(),
      category: "욕실",
      detail: "방수 공사",
      unit: "m²",
      unitPrice: 30000,
      quantity: 8,
      totalPrice: 240000,
      isEdited: false,
    },
    {
      id: crypto.randomUUID(),
      category: "욕실",
      detail: "위생도기 교체",
      unit: "ea",
      unitPrice: 350000,
      quantity: 2,
      totalPrice: 700000,
      isEdited: false,
    },
    // 주방
    {
      id: crypto.randomUUID(),
      category: "주방",
      detail: "싱크대 교체",
      unit: "ea",
      unitPrice: 2500000,
      quantity: 1,
      totalPrice: 2500000,
      isEdited: false,
    },
    // 전기
    {
      id: crypto.randomUUID(),
      category: "전기",
      detail: "조명 교체 (LED)",
      unit: "ea",
      unitPrice: 45000,
      quantity: 15,
      totalPrice: 675000,
      isEdited: false,
    },
    {
      id: crypto.randomUUID(),
      category: "전기",
      detail: "콘센트/스위치 교체",
      unit: "ea",
      unitPrice: 15000,
      quantity: 20,
      totalPrice: 300000,
      isEdited: false,
    },
    // 설비
    {
      id: crypto.randomUUID(),
      category: "설비",
      detail: "배관 교체",
      unit: "식",
      unitPrice: 1200000,
      quantity: 1,
      totalPrice: 1200000,
      isEdited: false,
    },
  ];
}

/**
 * Mock 시세 데이터 — 각 카테고리+세부항목별 시세 범위
 */
export const MARKET_PRICES: Record<string, { low: number; high: number }> = {
  "철거|기존 내부 철거": { low: 2000000, high: 3500000 },
  "철거|폐기물 처리": { low: 500000, high: 1000000 },
  "목공사|천장 틀 작업": { low: 25000, high: 40000 },
  "목공사|걸레받이": { low: 8000, high: 15000 },
  "도배|실크벽지 도배": { low: 6000, high: 10000 },
  "바닥|강마루 시공": { low: 35000, high: 55000 },
  "욕실|타일 시공 (벽+바닥)": { low: 50000, high: 80000 },
  "욕실|방수 공사": { low: 25000, high: 40000 },
  "욕실|위생도기 교체": { low: 250000, high: 500000 },
  "주방|싱크대 교체": { low: 2000000, high: 3500000 },
  "전기|조명 교체 (LED)": { low: 30000, high: 60000 },
  "전기|콘센트/스위치 교체": { low: 10000, high: 25000 },
  "설비|배관 교체": { low: 800000, high: 1500000 },
};

/**
 * 항목의 가격 등급 산출
 */
export function getPriceRating(
  category: string,
  detail: string,
  unitPrice: number
): { rating: "적정" | "주의" | "과다" | "저가"; low: number; high: number } {
  const key = `${category}|${detail}`;
  const market = MARKET_PRICES[key];

  if (!market) {
    return { rating: "적정", low: unitPrice * 0.7, high: unitPrice * 1.3 };
  }

  if (unitPrice < market.low * 0.8) {
    return { rating: "저가", ...market };
  }
  if (unitPrice <= market.high) {
    return { rating: "적정", ...market };
  }
  if (unitPrice <= market.high * 1.3) {
    return { rating: "주의", ...market };
  }
  return { rating: "과다", ...market };
}

/**
 * 전체 바가지 점수 계산 (0~100)
 */
export function calculateBadPriceScore(
  items: ExtractedLineItem[]
): number {
  if (items.length === 0) return 0;

  let totalWeight = 0;
  let weightedScore = 0;

  items.forEach((item) => {
    const { rating } = getPriceRating(item.category, item.detail, item.unitPrice);
    const weight = item.totalPrice; // 금액이 클수록 가중치 높음

    let score = 0;
    switch (rating) {
      case "저가": score = 10; break;
      case "적정": score = 20; break;
      case "주의": score = 60; break;
      case "과다": score = 90; break;
    }

    weightedScore += score * weight;
    totalWeight += weight;
  });

  return totalWeight > 0 ? Math.round(weightedScore / totalWeight) : 0;
}
