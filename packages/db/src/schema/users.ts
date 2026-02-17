import { pgTable, uuid, varchar, text, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";

/**
 * 사용자 역할 Enum (v1.0 호환 유지)
 * - user: 일반 사용자
 * - admin: 관리자
 * - partner: 시공 파트너
 */
export const userRoleEnum = pgEnum("user_role", ["user", "admin", "partner"]);

/**
 * 사용자 모드 Enum (v2.0)
 * - consumer: 소비자 (시공 요청자)
 * - contractor: 시공사 (입찰자)
 */
export const userModeEnum = pgEnum("user_mode", ["consumer", "contractor"]);

/**
 * 사용자 티어 Enum
 */
export const userTierEnum = pgEnum("user_tier", ["free", "basic", "premium"]);

/**
 * Users 테이블
 */
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  nickname: varchar("nickname", { length: 50 }).notNull(),
  role: userRoleEnum("role").notNull().default("user"),
  userMode: userModeEnum("user_mode").notNull().default("consumer"),
  tier: userTierEnum("tier").notNull().default("free"),
  points: integer("points").notNull().default(0),
  profileImageUrl: text("profile_image_url"),
  businessProfileId: uuid("business_profile_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Business Profiles 테이블 (시공사 사업자 정보)
 */
export const businessProfiles = pgTable("business_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  companyName: varchar("company_name", { length: 100 }).notNull(),
  businessNumber: varchar("business_number", { length: 20 }).notNull(),
  representativeName: varchar("representative_name", { length: 50 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  verified: boolean("verified").notNull().default(false),
  specialty: text("specialty"), // JSON array: ["인테리어", "욕실", "주방"]
  serviceRegions: text("service_regions"), // JSON array: ["서울 강남구", "서울 서초구"]
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
