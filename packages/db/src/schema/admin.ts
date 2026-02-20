import { pgTable, uuid, text, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { users } from "./users";

/**
 * 신고 대상 타입 Enum
 * - post: 커뮤니티 게시글
 * - comment: 댓글
 * - bid: 입찰
 */
export const reportTargetTypeEnum = pgEnum("report_target_type", [
  "post",
  "comment",
  "bid",
]);

/**
 * 신고 사유 Enum
 */
export const reportReasonEnum = pgEnum("report_reason", [
  "fake_bid",
  "inappropriate",
  "spam",
  "false_info",
  "harassment",
  "other",
]);

/**
 * 신고 처리 상태 Enum
 */
export const reportStatusEnum = pgEnum("report_status", [
  "pending",
  "reviewing",
  "resolved",
  "dismissed",
]);

/**
 * 페널티 유형 Enum
 */
export const penaltyTypeEnum = pgEnum("penalty_type", [
  "warning",
  "suspension",
]);

/**
 * Reports 테이블 (신고)
 */
export const reports = pgTable("reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  reporterId: uuid("reporter_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  targetType: reportTargetTypeEnum("target_type").notNull(),
  targetId: uuid("target_id").notNull(),
  targetUserId: uuid("target_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  reason: reportReasonEnum("reason").notNull(),
  description: text("description"),
  status: reportStatusEnum("status").notNull().default("pending"),
  adminNote: text("admin_note"),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  resolvedBy: uuid("resolved_by").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Penalties 테이블 (페널티)
 */
export const penalties = pgTable("penalties", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: penaltyTypeEnum("type").notNull(),
  reason: text("reason").notNull(),
  reportId: uuid("report_id").references(() => reports.id, {
    onDelete: "set null",
  }),
  isActive: boolean("is_active").notNull().default(true),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
