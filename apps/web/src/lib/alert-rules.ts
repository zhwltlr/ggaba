import type { ExtractedLineItem } from "@/stores/use-diagnosis-store";
import { getPriceRating } from "./mock-ocr";

export interface AlertItem {
  type: "warning" | "danger" | "info";
  message: string;
}

/**
 * 규칙 기반 자동 알림 엔진
 * 견적 항목을 분석하여 경고/주의/정보 알림을 생성합니다.
 */
export function generateAlerts(items: ExtractedLineItem[]): AlertItem[] {
  const alerts: AlertItem[] = [];
  const categories = new Set(items.map((i) => i.category));
  const totalPrice = items.reduce((sum, i) => sum + i.totalPrice, 0);

  // ── 1. 누락 항목 체크 ──

  if (!categories.has("철거")) {
    alerts.push({
      type: "warning",
      message: "철거 비용이 누락되었습니다. 리모델링 시 철거 공사가 포함되는지 확인하세요.",
    });
  }

  if (categories.has("욕실") && !items.some((i) => i.detail.includes("방수"))) {
    alerts.push({
      type: "danger",
      message:
        "욕실 방수 공사가 누락되었습니다. 방수 미시공 시 누수 위험이 있습니다.",
    });
  }

  if (!categories.has("전기") && totalPrice > 5000000) {
    alerts.push({
      type: "info",
      message:
        "전기 공사가 포함되지 않았습니다. 조명/콘센트 교체 필요 여부를 확인하세요.",
    });
  }

  if (!items.some((i) => i.detail.includes("폐기물") || i.detail.includes("잔재"))) {
    alerts.push({
      type: "info",
      message:
        "폐기물 처리 비용이 별도로 표기되지 않았습니다. 포함 여부를 확인하세요.",
    });
  }

  // ── 2. 인건비 비율 체크 ──

  const laborCategories = ["인건비", "노무비", "인부비"];
  const laborTotal = items
    .filter((i) => laborCategories.some((lc) => i.category.includes(lc) || i.detail.includes(lc)))
    .reduce((sum, i) => sum + i.totalPrice, 0);

  if (totalPrice > 0 && laborTotal > 0) {
    const laborRatio = laborTotal / totalPrice;
    if (laborRatio > 0.35) {
      alerts.push({
        type: "warning",
        message: `인건비 비율이 ${Math.round(laborRatio * 100)}%로 평균(35%)보다 높습니다.`,
      });
    }
  }

  // ── 3. 개별 항목 과다 단가 체크 ──

  items.forEach((item) => {
    const { rating, high } = getPriceRating(item.category, item.detail, item.unitPrice);

    if (rating === "과다" && high > 0) {
      const ratio = item.unitPrice / high;
      if (ratio >= 2) {
        alerts.push({
          type: "danger",
          message: `${item.category} - ${item.detail}: 단가가 시세의 ${ratio.toFixed(1)}배입니다. 반드시 확인하세요.`,
        });
      } else {
        alerts.push({
          type: "warning",
          message: `${item.category} - ${item.detail}: 시세 대비 ${Math.round((ratio - 1) * 100)}% 높습니다.`,
        });
      }
    }
  });

  // ── 4. 전체 합계 체크 ──

  // 평수당 비용이 과도한지 체크 (추후 userInput에서 평수 받아올 수 있음)
  if (items.length > 0 && totalPrice > 50000000) {
    alerts.push({
      type: "info",
      message: `총 견적액이 ${(totalPrice / 10000).toLocaleString()}만원으로 높은 편입니다. 항목별 단가를 꼼꼼히 확인하세요.`,
    });
  }

  // ── 5. 저가 항목 경고 ──

  const underPricedItems = items.filter((item) => {
    const { rating } = getPriceRating(item.category, item.detail, item.unitPrice);
    return rating === "저가";
  });

  if (underPricedItems.length >= 3) {
    alerts.push({
      type: "info",
      message: `${underPricedItems.length}개 항목이 시세보다 낮습니다. 품질이나 자재 등급을 확인하세요.`,
    });
  }

  return alerts;
}
