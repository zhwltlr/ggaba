/**
 * 날짜를 한국어 형식으로 포맷합니다.
 * @example formatDate(new Date()) => "2024년 3월 15일"
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

/**
 * 날짜를 YYYY-MM-DD 형식으로 포맷합니다.
 */
export function formatDateISO(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * 숫자를 한국 원화 형식으로 포맷합니다.
 * @example formatCurrency(1500000) => "1,500,000원"
 */
export function formatCurrency(amount: number): string {
  return `${new Intl.NumberFormat("ko-KR").format(amount)}원`;
}

/**
 * 숫자를 만원 단위로 포맷합니다.
 * @example formatCurrencyInTenThousand(1500000) => "150만원"
 */
export function formatCurrencyInTenThousand(amount: number): string {
  const inManWon = amount / 10000;
  if (inManWon >= 10000) {
    return `${(inManWon / 10000).toFixed(1)}억원`;
  }
  return `${new Intl.NumberFormat("ko-KR").format(inManWon)}만원`;
}
