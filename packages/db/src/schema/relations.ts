import { relations } from "drizzle-orm";
import { users } from "./users";
import { estimates } from "./estimates";
import { estimateItems } from "./estimate-items";
import { communityPosts, comments, reviews } from "./community";

// ── Users 관계 ──
export const usersRelations = relations(users, ({ many }) => ({
  estimates: many(estimates),
  communityPosts: many(communityPosts),
  comments: many(comments),
  writtenReviews: many(reviews, { relationName: "reviewer" }),
  receivedReviews: many(reviews, { relationName: "reviewee" }),
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
}));
