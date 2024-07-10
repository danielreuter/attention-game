import { InferSelectModel } from "drizzle-orm";
import * as s from "./schema";
import { NeonDatabase } from "drizzle-orm/neon-serverless";

export type Database = NeonDatabase<typeof s>;

export type Price = InferSelectModel<typeof s.price>;
export type InsertPrice = InferSelectModel<typeof s.price>;

export type Product = InferSelectModel<typeof s.product>;
export type InsertProduct = InferSelectModel<typeof s.product>;

export type Subscription = InferSelectModel<typeof s.subscription>;
export type InsertSubscription = InferSelectModel<typeof s.subscription>;
