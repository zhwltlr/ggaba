import { z } from "zod";

export const REGIONS = [
  "서울 강남구", "서울 서초구", "서울 송파구", "서울 강동구",
  "서울 마포구", "서울 용산구", "서울 성동구", "서울 광진구",
  "서울 동작구", "서울 영등포구", "서울 강서구", "서울 양천구",
  "서울 구로구", "서울 금천구", "서울 관악구", "서울 서대문구",
  "서울 은평구", "서울 종로구", "서울 중구", "서울 동대문구",
  "서울 성북구", "서울 강북구", "서울 도봉구", "서울 노원구",
  "서울 중랑구",
  "경기 성남시", "경기 용인시", "경기 수원시", "경기 화성시",
  "경기 고양시", "경기 파주시", "경기 김포시", "경기 부천시",
  "경기 안양시", "경기 광명시", "경기 하남시",
  "인천", "부산", "대구", "대전", "광주", "울산", "세종",
] as const;

export const BUILDING_TYPES = [
  "아파트",
  "빌라/다세대",
  "오피스텔",
  "단독주택",
  "상가/사무실",
] as const;

export const diagnosisInfoSchema = z.object({
  region: z.string().min(1, "지역을 선택해주세요"),
  buildingType: z.string().min(1, "건물 유형을 선택해주세요"),
  sizePyeong: z
    .number({ invalid_type_error: "숫자를 입력해주세요" })
    .min(1, "평수는 1 이상이어야 합니다")
    .max(200, "평수는 200 이하여야 합니다"),
  title: z.string().min(1, "제목을 입력해주세요").max(100, "제목은 100자 이하여야 합니다"),
});

export type DiagnosisInfo = z.infer<typeof diagnosisInfoSchema>;
