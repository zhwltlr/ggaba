import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  numeric,
  boolean,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { users } from "./users";

/**
 * 견적 상태 Enum
 * - pending: 업로드 완료, 진단 대기
 * - diagnosing: AI 분석 중
 * - diagnosed: 진단 완료
 * - expired: 만료됨
 */
export const estimateStatusEnum = pgEnum("estimate_status", [
  "pending",
  "diagnosing",
  "diagnosed",
  "expired",
]);

/**
 * Estimates 테이블 (견적서)
 * - bad_price_score: 바가지 점수 (0~100, 높을수록 바가지)
 * - privacy_masked: 개인정보 마스킹 여부 (이미지/텍스트)
 */
export const estimates = pgTable("estimates", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 200 }).notNull(),
  status: estimateStatusEnum("status").notNull().default("pending"),

  // 견적 메타 정보
  region: varchar("region", { length: 100 }),
  sizePyeong: numeric("size_pyeong", { precision: 6, scale: 1 }),
  buildingType: varchar("building_type", { length: 50 }),

  // 금액 및 점수
  totalPrice: integer("total_price"),
  badPriceScore: integer("bad_price_score"),
  diagnosisResult: text("diagnosis_result"),

  // 원본 파일
  originalFileUrl: text("original_file_url"),
  originalFileName: varchar("original_file_name", { length: 255 }),

  // 개인정보 보호 (Privacy Masking)
  isImageMasked: boolean("is_image_masked").notNull().default(false),
  isTextMasked: boolean("is_text_masked").notNull().default(false),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
