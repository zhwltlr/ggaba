import { pgTable, uuid, varchar, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { users } from "./users";
import { auctions } from "./auctions";

/**
 * 채팅방 상태 Enum
 */
export const chatRoomStatusEnum = pgEnum("chat_room_status", ["active", "closed"]);

/**
 * 메시지 유형 Enum
 */
export const messageTypeEnum = pgEnum("message_type", ["text", "image", "file"]);

/**
 * ChatRooms 테이블 (1:1 채팅방)
 */
export const chatRooms = pgTable("chat_rooms", {
  id: uuid("id").primaryKey().defaultRandom(),
  auctionId: uuid("auction_id").notNull().references(() => auctions.id, { onDelete: "cascade" }),
  consumerId: uuid("consumer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  contractorId: uuid("contractor_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: chatRoomStatusEnum("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Messages 테이블 (채팅 메시지)
 */
export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  chatRoomId: uuid("chat_room_id").notNull().references(() => chatRooms.id, { onDelete: "cascade" }),
  senderId: uuid("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  type: messageTypeEnum("type").notNull().default("text"),
  fileUrl: text("file_url"),
  readAt: timestamp("read_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
