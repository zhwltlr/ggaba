import { pgTable, uuid, varchar, text, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";

/**
 * 사용자 역할 Enum
 * - user: 일반 사용자 (견적 업로드/진단 요청)
 * - admin: 관리자
 * - partner: 시공 파트너 (Phase 3 역경매 참여)
 */
export const userRoleEnum = pgEnum("user_role", ["user", "admin", "partner"]);

/**
 * 사용자 티어 Enum
 * - free: 무료 회원
 * - basic: 기본 유료 회원
 * - premium: 프리미엄 회원
 */
export const userTierEnum = pgEnum("user_tier", ["free", "basic", "premium"]);

/**
 * Users 테이블
 * - Supabase Auth와 연동 (auth.users.id를 참조)
 * - points: 포인트 시스템 (견적 진단 등에 사용)
 * - tier: 사용자 등급
 */
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  nickname: varchar("nickname", { length: 50 }).notNull(),
  role: userRoleEnum("role").notNull().default("user"),
  tier: userTierEnum("tier").notNull().default("free"),
  points: integer("points").notNull().default(0),
  profileImageUrl: text("profile_image_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
