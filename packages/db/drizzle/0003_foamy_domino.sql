DROP INDEX IF EXISTS "global_date_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "chat_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "user_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "id_idx";--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "chats_id_idx" ON "telegram"."chats" ("telegram_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "messages_global_date_idx" ON "telegram"."messages" ("date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "messages_chat_idx" ON "telegram"."messages" ("chat_id","date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "messages_user_idx" ON "telegram"."messages" ("user_id","date");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "messages_id_idx" ON "telegram"."messages" ("chat_id","message_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_id_idx" ON "telegram"."users" ("user_id");