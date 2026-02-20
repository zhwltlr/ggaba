import { relations } from "drizzle-orm";
import { users, businessProfiles } from "./users";
import { estimates } from "./estimates";
import { estimateItems } from "./estimate-items";
import { communityPosts, comments, reviews } from "./community";
import { auctions } from "./auctions";
import { bids, bidItems } from "./bids";
import { portfolios } from "./portfolios";
import { chatRooms, messages } from "./chat";
import { reports, penalties } from "./admin";

// ── Users 관계 ──
export const usersRelations = relations(users, ({ one, many }) => ({
  businessProfile: one(businessProfiles, {
    fields: [users.businessProfileId],
    references: [businessProfiles.id],
  }),
  estimates: many(estimates),
  communityPosts: many(communityPosts),
  comments: many(comments),
  writtenReviews: many(reviews, { relationName: "reviewer" }),
  receivedReviews: many(reviews, { relationName: "reviewee" }),
  auctions: many(auctions),
  bids: many(bids),
  portfolios: many(portfolios),
  submittedReports: many(reports, { relationName: "reporter" }),
  receivedReports: many(reports, { relationName: "targetUser" }),
  penalties: many(penalties, { relationName: "penalizedUser" }),
}));

// ── BusinessProfiles 관계 ──
export const businessProfilesRelations = relations(businessProfiles, ({ one }) => ({
  user: one(users, {
    fields: [businessProfiles.userId],
    references: [users.id],
  }),
}));

// ── Estimates 관계 ──
export const estimatesRelations = relations(estimates, ({ one, many }) => ({
  user: one(users, {
    fields: [estimates.userId],
    references: [users.id],
  }),
  items: many(estimateItems),
  communityPosts: many(communityPosts),
  reviews: many(reviews),
}));

// ── EstimateItems 관계 ──
export const estimateItemsRelations = relations(estimateItems, ({ one }) => ({
  estimate: one(estimates, {
    fields: [estimateItems.estimateId],
    references: [estimates.id],
  }),
}));

// ── CommunityPosts 관계 ──
export const communityPostsRelations = relations(
  communityPosts,
  ({ one, many }) => ({
    user: one(users, {
      fields: [communityPosts.userId],
      references: [users.id],
    }),
    estimate: one(estimates, {
      fields: [communityPosts.estimateId],
      references: [estimates.id],
    }),
    comments: many(comments),
  })
);

// ── Comments 관계 ──
export const commentsRelations = relations(comments, ({ one }) => ({
  post: one(communityPosts, {
    fields: [comments.postId],
    references: [communityPosts.id],
  }),
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
}));

// ── Reviews 관계 ──
export const reviewsRelations = relations(reviews, ({ one }) => ({
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id],
    relationName: "reviewer",
  }),
  partner: one(users, {
    fields: [reviews.partnerId],
    references: [users.id],
    relationName: "reviewee",
  }),
  estimate: one(estimates, {
    fields: [reviews.estimateId],
    references: [estimates.id],
  }),
  auction: one(auctions, {
    fields: [reviews.auctionId],
    references: [auctions.id],
  }),
}));

// ── Auctions 관계 ──
export const auctionsRelations = relations(auctions, ({ one, many }) => ({
  user: one(users, {
    fields: [auctions.userId],
    references: [users.id],
  }),
  bids: many(bids),
  chatRooms: many(chatRooms),
  reviews: many(reviews),
}));

// ── Bids 관계 ──
export const bidsRelations = relations(bids, ({ one, many }) => ({
  auction: one(auctions, {
    fields: [bids.auctionId],
    references: [auctions.id],
  }),
  contractor: one(users, {
    fields: [bids.contractorId],
    references: [users.id],
  }),
  items: many(bidItems),
}));

// ── BidItems 관계 ──
export const bidItemsRelations = relations(bidItems, ({ one }) => ({
  bid: one(bids, {
    fields: [bidItems.bidId],
    references: [bids.id],
  }),
}));

// ── Portfolios 관계 ──
export const portfoliosRelations = relations(portfolios, ({ one }) => ({
  contractor: one(users, {
    fields: [portfolios.contractorId],
    references: [users.id],
  }),
}));

// ── ChatRooms 관계 ──
export const chatRoomsRelations = relations(chatRooms, ({ one, many }) => ({
  auction: one(auctions, {
    fields: [chatRooms.auctionId],
    references: [auctions.id],
  }),
  consumer: one(users, {
    fields: [chatRooms.consumerId],
    references: [users.id],
    relationName: "consumerChats",
  }),
  contractor: one(users, {
    fields: [chatRooms.contractorId],
    references: [users.id],
    relationName: "contractorChats",
  }),
  messages: many(messages),
}));

// ── Messages 관계 ──
export const messagesRelations = relations(messages, ({ one }) => ({
  chatRoom: one(chatRooms, {
    fields: [messages.chatRoomId],
    references: [chatRooms.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
}));

// ── Reports 관계 ──
export const reportsRelations = relations(reports, ({ one }) => ({
  reporter: one(users, {
    fields: [reports.reporterId],
    references: [users.id],
    relationName: "reporter",
  }),
  targetUser: one(users, {
    fields: [reports.targetUserId],
    references: [users.id],
    relationName: "targetUser",
  }),
  resolver: one(users, {
    fields: [reports.resolvedBy],
    references: [users.id],
    relationName: "resolver",
  }),
}));

// ── Penalties 관계 ──
export const penaltiesRelations = relations(penalties, ({ one }) => ({
  user: one(users, {
    fields: [penalties.userId],
    references: [users.id],
    relationName: "penalizedUser",
  }),
  report: one(reports, {
    fields: [penalties.reportId],
    references: [reports.id],
  }),
  creator: one(users, {
    fields: [penalties.createdBy],
    references: [users.id],
    relationName: "penaltyCreator",
  }),
}));
