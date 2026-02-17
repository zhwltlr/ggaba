import {
  pgTable,
  uuid,
  varchar,
  integer,
  numeric,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { estimates } from "./estimates";

/**
 * EstimateItems 테이블 (견적 항목)
 *
 * 핵심: 4-tier 계층 구조
 * ┌─────────────────────────────────────────────────────┐
 * │ Category (대분류)  │ 예: 욕실, 주방, 거실, 도배 등        │
 * │ Detail   (세부항목) │ 예: 타일시공, 방수공사, 설비교체    │
 * │ Unit     (단위)    │ 예: m², ea, 식, m                  │
 * │ UnitPrice(단가)    │ 예: 35,000원/m²                    │
 * └─────────────────────────────────────────────────────┘
 *
 * quantity × unitPrice = totalPrice (항목별 소계)
 *
 * 이 구조는 Phase 3 역경매에서 시공사들이
 * 동일한 항목 기준으로 가격을 비교할 수 있게 해줍니다.
 */
export const estimateItems = pgTable("estimate_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  estimateId: uuid("estimate_id")
    .notNull()
    .references(() => estimates.id, { onDelete: "cascade" }),

  // 4-tier 계층 구조
  category: varchar("category", { length: 100 }).notNull(),
  detail: varchar("detail", { length: 200 }).notNull(),
  unit: varchar("unit", { length: 20 }).notNull(),
  unitPrice: integer("unit_price").notNull(),

  // 수량 및 합계
  quantity: numeric("quantity", { precision: 10, scale: 2 }).notNull(),
  totalPrice: integer("total_price").notNull(),

  // 정렬 순서 (견적서 내 항목 순서 보존)
  sortOrder: integer("sort_order").notNull().default(0),

  // AI 분석 결과
  priceRating: varchar("price_rating", { length: 20 }),
  marketPriceLow: integer("market_price_low"),
  marketPriceHigh: integer("market_price_high"),
  note: text("note"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
