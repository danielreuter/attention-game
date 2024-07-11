DO $$ BEGIN
 CREATE TYPE "public"."pricing_plan_interval" AS ENUM('day', 'week', 'month', 'year');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."pricing_type" AS ENUM('one_time', 'recurring');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."provider_names" AS ENUM('google', 'github');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."subscription_status" AS ENUM('trialing', 'active', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'unpaid', 'paused');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "daily" (
	"date" date PRIMARY KEY DEFAULT now() NOT NULL,
	"game_id" serial NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "game" (
	"id" serial PRIMARY KEY NOT NULL,
	"subject" text NOT NULL,
	"sentence" text NOT NULL,
	"is_practice" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "oauth_account" (
	"user_id" text NOT NULL,
	"provider_name" "provider_names" NOT NULL,
	"provider_user_id" text NOT NULL,
	CONSTRAINT "oauth_account_provider_name_provider_user_id_pk" PRIMARY KEY("provider_name","provider_user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "play" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"game_id" serial NOT NULL,
	"user_id" text NOT NULL,
	"submission_id" uuid
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "price" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"active" boolean NOT NULL,
	"unit_amount" integer,
	"currency" text NOT NULL,
	"type" "pricing_type" NOT NULL,
	"interval" "pricing_plan_interval",
	"interval_count" integer,
	"trial_period_days" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "product" (
	"id" text PRIMARY KEY NOT NULL,
	"active" boolean NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"image" text,
	"metadata" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "query" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"play_id" uuid NOT NULL,
	"content" text NOT NULL,
	"raw_response" text NOT NULL,
	"response" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "session" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"expires_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "submission" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"play_id" uuid NOT NULL,
	"content" text NOT NULL,
	"is_correct" boolean NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "subscription" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"status" "subscription_status" NOT NULL,
	"metadata" jsonb NOT NULL,
	"price_id" text NOT NULL,
	"quantity" integer NOT NULL,
	"cancel_at_period_end" boolean NOT NULL,
	"cancel_at" timestamp with time zone,
	"canceled_at" timestamp with time zone,
	"current_period_start" timestamp with time zone DEFAULT now() NOT NULL,
	"current_period_end" timestamp with time zone DEFAULT now() NOT NULL,
	"created" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone,
	"trial_start" timestamp with time zone,
	"trial_end" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user" (
	"id" text PRIMARY KEY NOT NULL,
	"display_name" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"is_admin" boolean DEFAULT false NOT NULL,
	"email" text NOT NULL,
	"stripe_customer_id" text NOT NULL,
	"billing_address" jsonb,
	"payment_method" jsonb,
	CONSTRAINT "user_email_unique" UNIQUE("email"),
	CONSTRAINT "user_stripe_customer_id_unique" UNIQUE("stripe_customer_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "daily" ADD CONSTRAINT "daily_game_id_game_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."game"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "oauth_account" ADD CONSTRAINT "oauth_account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "play" ADD CONSTRAINT "play_game_id_game_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."game"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "play" ADD CONSTRAINT "play_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "price" ADD CONSTRAINT "price_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "query" ADD CONSTRAINT "query_play_id_play_id_fk" FOREIGN KEY ("play_id") REFERENCES "public"."play"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "submission" ADD CONSTRAINT "submission_play_id_play_id_fk" FOREIGN KEY ("play_id") REFERENCES "public"."play"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "subscription" ADD CONSTRAINT "subscription_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "subscription" ADD CONSTRAINT "subscription_price_id_price_id_fk" FOREIGN KEY ("price_id") REFERENCES "public"."price"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
