import { pgTable, uuid, varchar, text, integer, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";

/**
 * Portfolios 테이블 (시공사 포트폴리오)
 */
export const portfolios = pgTable("portfolios", {
  id: uuid("id").primaryKey().defaultRandom(),
  contractorId: uuid("contractor_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  region: varchar("region", { length: 100 }),
  sizePyeong: integer("size_pyeong"),
  durationDays: integer("duration_days"),
  totalCost: integer("total_cost"),
  beforeImageUrls: text("before_image_urls"), // JSON array
  afterImageUrls: text("after_image_urls"),   // JSON array
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
