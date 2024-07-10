import {
  pgTable,
  text,
  integer,
  boolean,
  primaryKey,
  jsonb,
  uuid,
  timestamp,
  foreignKey,
  varchar,
  pgEnum,
} from "drizzle-orm/pg-core";
import {
  BuildQueryResult,
  DBQueryConfig,
  ExtractTablesWithRelations,
  relations,
} from "drizzle-orm";
import { customType } from "drizzle-orm/pg-core";

/**
 *
 * User and auth
 */

export const providerNames = pgEnum("provider_names", ["google", "github"]);

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  displayName: text("display_name").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  isAdmin: boolean("is_admin").notNull().default(false),
  email: text("email").notNull().unique(),
  stripeCustomerId: text("stripe_customer_id").notNull().unique(),
  billingAddress: jsonb("billing_address"),
  paymentMethod: jsonb("payment_method"),
});

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  plays: many(play),
}));

export const oauthAccount = pgTable(
  "oauth_account",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id),
    providerName: providerNames("provider_name").notNull(),
    providerUserId: text("provider_user_id").notNull(),
  },
  ({ providerName, providerUserId }) => ({
    pk: primaryKey({ columns: [providerName, providerUserId] }),
  }),
);

export const oauthAccountRelations = relations(oauthAccount, ({ one }) => ({
  user: one(user, {
    fields: [oauthAccount.userId],
    references: [user.id],
  }),
}));

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
});

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

/**
 *
 * Game
 */

export const game = pgTable("game", {
  id: uuid("id").primaryKey().defaultRandom(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  sentence: text("sentence").notNull(),
  isPractice: boolean("is_practice").notNull().default(false),
});

export const gameRelations = relations(game, ({ many }) => ({
  plays: many(play),
}));

export const play = pgTable("play", {
  id: uuid("id").primaryKey().defaultRandom(),
  gameId: uuid("game_id")
    .notNull()
    .references(() => game.id),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  submissionId: uuid("submission_id"), // can be null
});

export const playRelations = relations(play, ({ one, many }) => ({
  game: one(game, {
    fields: [play.gameId],
    references: [game.id],
  }),
  user: one(user, {
    fields: [play.userId],
    references: [user.id],
  }),
  submission: one(submission, {
    fields: [play.submissionId],
    references: [submission.id],
  }),
  queries: many(query),
}));

export const query = pgTable("query", {
  id: uuid("id").primaryKey().defaultRandom(),
  content: text("content").notNull(),
  rawResponse: text("raw_response").notNull(),
  response: text("response").notNull(),
});

export const submission = pgTable("submission", {
  id: uuid("id").primaryKey().defaultRandom(),
  content: text("content").notNull(),
  isCorrect: boolean("is_correct").notNull(),
});

/**
 *
 * Payments
 */

export const product = pgTable("product", {
  id: text("id").primaryKey(),
  active: boolean("active").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  image: text("image"),
  metadata: jsonb("metadata").notNull(),
});

export const pricingType = pgEnum("pricing_type", ["one_time", "recurring"]);
export const pricingPlanInterval = pgEnum("pricing_plan_interval", [
  "day",
  "week",
  "month",
  "year",
]);

export const price = pgTable("price", {
  id: text("id").primaryKey(),
  productId: text("product_id")
    .notNull()
    .references(() => product.id),
  active: boolean("active").notNull(),
  unitAmount: integer("unit_amount"),
  currency: text("currency").notNull(),
  type: pricingType("type").notNull(),
  interval: pricingPlanInterval("interval"),
  intervalCount: integer("interval_count"),
  trialPeriodDays: integer("trial_period_days"),
});

export const priceRelations = relations(price, ({ one }) => ({
  product: one(product, {
    fields: [price.productId],
    references: [product.id],
  }),
}));

export const subscriptionStatus = pgEnum("subscription_status", [
  "trialing",
  "active",
  "canceled",
  "incomplete",
  "incomplete_expired",
  "past_due",
  "unpaid",
  "paused",
]);

export const subscription = pgTable("subscription", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  status: subscriptionStatus("status").notNull(),
  metadata: jsonb("metadata").notNull(),
  priceId: text("price_id")
    .notNull()
    .references(() => price.id),
  quantity: integer("quantity").notNull(),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull(),
  cancelAt: timestamp("cancel_at", { withTimezone: true }),
  canceledAt: timestamp("canceled_at", { withTimezone: true }),
  currentPeriodStart: timestamp("current_period_start", { withTimezone: true })
    .defaultNow()
    .notNull(),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true })
    .defaultNow()
    .notNull(),
  created: timestamp("created", { withTimezone: true }).defaultNow().notNull(),
  endedAt: timestamp("ended_at", { withTimezone: true }),
  trialStart: timestamp("trial_start", { withTimezone: true }),
  trialEnd: timestamp("trial_end", { withTimezone: true }),
});

export const subscriptionRelations = relations(subscription, ({ one }) => ({
  user: one(user, {
    fields: [subscription.userId],
    references: [user.id],
  }),
  price: one(price, {
    fields: [subscription.priceId],
    references: [price.id],
  }),
}));
