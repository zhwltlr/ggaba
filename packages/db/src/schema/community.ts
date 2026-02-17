import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { estimates } from "./estimates";

/**
 * 커뮤니티 게시글 타입 Enum
 * - review: 시공 후기
 * - share: 견적 공유
 * - qna: 질문/답변
 */
export const postTypeEnum = pgEnum("post_type", ["review", "share", "qna"]);

/**
 * CommunityPosts 테이블
 * - 견적서와 선택적으로 연결 (견적 공유 시)
 * - Privacy Masking: 이미지/가격 마스킹 여부
 */
export const communityPosts = pgTable("community_posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  estimateId: uuid("estimate_id").references(() => estimates.id, {
    onDelete: "set null",
  }),

  type: postTypeEnum("type").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  content: text("content").notNull(),

  // 이미지 (JSON 배열로 URL 저장)
  imageUrls: text("image_urls"),

  // Privacy Masking 플래그
  isPriceMasked: boolean("is_price_masked").notNull().default(false),
  isImageMasked: boolean("is_image_masked").notNull().default(false),

  // 통계
  viewCount: integer("view_count").notNull().default(0),
  likeCount: integer("like_count").notNull().default(0),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Comments 테이블 (댓글)
 */
export const comments = pgTable("comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  postId: uuid("post_id")
    .notNull()
    .references(() => communityPosts.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  parentId: uuid("parent_id"),

  content: text("content").notNull(),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Reviews 테이블 (시공 파트너 리뷰 - Phase 3 대비)
 */
export const reviews = pgTable("reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  partnerId: uuid("partner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  estimateId: uuid("estimate_id").references(() => estimates.id, {
    onDelete: "set null",
  }),

  rating: integer("rating").notNull(),
  content: text("content"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
