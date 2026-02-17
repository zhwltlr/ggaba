import { pgTable, uuid, varchar, text, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { users } from "./users";

/**
 * 경매 상태 Enum
 */
export const auctionStatusEnum = pgEnum("auction_status", [
  "open",        // 공개 — 입찰 접수 대기
  "bidding",     // 입찰 진행 중
  "selected",    // 시공사 선택 완료
  "in_progress", // 시공 진행 중
  "completed",   // 시공 완료
  "cancelled",   // 취소됨
]);

/**
 * Auctions 테이블 (소비자의 시공 요청)
 */
export const auctions = pgTable("auctions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 200 }).notNull(),
  region: varchar("region", { length: 100 }).notNull(),
  sizePyeong: integer("size_pyeong").notNull(),
  budgetMin: integer("budget_min"),
  budgetMax: integer("budget_max"),
  schedule: varchar("schedule", { length: 100 }), // e.g. "2026년 3월 중", "즉시 가능"
  description: text("description"),
  imageUrls: text("image_urls"), // JSON array of image URLs
  address: text("address"),      // 시공사에게 초기 비공개
  phone: varchar("phone", { length: 20 }), // 시공사에게 초기 비공개
  status: auctionStatusEnum("status").notNull().default("open"),
  bidCount: integer("bid_count").notNull().default(0),
  deadlineAt: timestamp("deadline_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
