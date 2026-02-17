import {
  pgTable,
  uuid,
  varchar,
  integer,
  numeric,
  text,
  timestamp,
  pgEnum,
  unique,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { auctions } from "./auctions";

/**
 * 입찰 상태 Enum
 */
export const bidStatusEnum = pgEnum("bid_status", [
  "submitted", // 입찰 제출됨
  "selected",  // 소비자가 선택함
  "rejected",  // 미선택 (다른 시공사가 선택됨)
]);

/**
 * Bids 테이블 (시공사의 입찰)
 */
export const bids = pgTable(
  "bids",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    auctionId: uuid("auction_id").notNull().references(() => auctions.id, { onDelete: "cascade" }),
    contractorId: uuid("contractor_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    totalPrice: integer("total_price").notNull(),
    message: text("message"), // 시공사 코멘트
    status: bidStatusEnum("status").notNull().default("submitted"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("bids_auction_contractor_unique").on(table.auctionId, table.contractorId),
  ],
);

/**
 * BidItems 테이블 (입찰 항목 — estimate_items와 동일한 4-tier 계층 구조)
 *
 * ┌─────────────────────────────────────────────────────┐
 * │ Category (대분류)  │ 예: 욕실, 주방, 거실, 도배 등        │
 * │ Detail   (세부항목) │ 예: 타일시공, 방수공사, 설비교체    │
 * │ Unit     (단위)    │ 예: m², ea, 식, m                  │
 * │ UnitPrice(단가)    │ 예: 35,000원/m²                    │
 * └─────────────────────────────────────────────────────┘
 *
 * AI 진단 기능 재활용 시 estimate_items와 데이터 호환 보장
 */
export const bidItems = pgTable("bid_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  bidId: uuid("bid_id").notNull().references(() => bids.id, { onDelete: "cascade" }),

  // 4-tier 계층 구조 (estimate_items와 동일)
  category: varchar("category", { length: 100 }).notNull(),
  detail: varchar("detail", { length: 200 }).notNull(),
  unit: varchar("unit", { length: 20 }).notNull(),
  unitPrice: integer("unit_price").notNull(),

  // 수량 및 합계
  quantity: numeric("quantity", { precision: 10, scale: 2 }).notNull(),
  totalPrice: integer("total_price").notNull(),

  // 정렬 순서
  sortOrder: integer("sort_order").notNull().default(0),

  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
