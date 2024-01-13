CREATE SCHEMA "telegram";
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "telegram"."chats" (
	"id" text PRIMARY KEY NOT NULL,
	"telegram_id" text NOT NULL,
	"is_group" text NOT NULL,
	"is_channel" text NOT NULL,
	"title" text,
	"member_count" text,
	"pfp_url" text,
	"last_message_date" timestamp,
	"description" text,
	"created_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "telegram"."messages" (
	"id" text PRIMARY KEY NOT NULL,
	"date" timestamp NOT NULL,
	"message_id" text NOT NULL,
	"message_text" text,
	"group_id" text,
	"in_reply_to_id" text,
	"entities" json,
	"created_at" timestamp,
	"chat_id" text NOT NULL,
	"user_id" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "telegram"."users" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"first_name" text,
	"last_name" text,
	"username" text,
	"pfp_url" text,
	"description" text,
	"created_at" timestamp
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "global_date_idx" ON "telegram"."messages" ("date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chat_idx" ON "telegram"."messages" ("chat_id","date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_idx" ON "telegram"."messages" ("user_id","date");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "id_idx" ON "telegram"."messages" ("chat_id","message_id");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "telegram"."messages" ADD CONSTRAINT "messages_chat_id_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "telegram"."chats"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "telegram"."messages" ADD CONSTRAINT "messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "telegram"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
