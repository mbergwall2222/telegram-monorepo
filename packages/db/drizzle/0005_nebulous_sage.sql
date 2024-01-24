ALTER TABLE "telegram"."tags_to_chats" DROP CONSTRAINT "tags_to_chats_tag_id_tags_id_fk";
--> statement-breakpoint
ALTER TABLE "telegram"."tags_to_messages" DROP CONSTRAINT "tags_to_messages_tag_id_tags_id_fk";
--> statement-breakpoint
ALTER TABLE "telegram"."tags_to_users" DROP CONSTRAINT "tags_to_users_tag_id_tags_id_fk";
--> statement-breakpoint
ALTER TABLE "telegram"."chats" ALTER COLUMN "last_message_date" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "telegram"."tags" ALTER COLUMN "order" SET NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chats_last_message_date_idx" ON "telegram"."chats" ("last_message_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "messages_reply_idx" ON "telegram"."messages" ("chat_id","in_reply_to_id","date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tags_to_chats_idx" ON "telegram"."tags_to_chats" ("chat_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tags_to_messages_idx" ON "telegram"."tags_to_messages" ("message_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tags_to_users_idx" ON "telegram"."tags_to_users" ("user_id");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "telegram"."tags_to_chats" ADD CONSTRAINT "tags_to_chats_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "telegram"."tags"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "telegram"."tags_to_messages" ADD CONSTRAINT "tags_to_messages_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "telegram"."tags"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "telegram"."tags_to_users" ADD CONSTRAINT "tags_to_users_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "telegram"."tags"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
