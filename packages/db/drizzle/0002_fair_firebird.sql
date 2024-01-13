CREATE TABLE IF NOT EXISTS "telegram"."documents" (
	"id" text PRIMARY KEY NOT NULL,
	"file_id" text NOT NULL,
	"file_url" text NOT NULL,
	"file_size" text,
	"mime_type" text NOT NULL,
	"file_name" text NOT NULL,
	"created_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "telegram"."saved_filters" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"params" text NOT NULL,
	"user_id" text NOT NULL,
	"org_id" text NOT NULL,
	"created_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "telegram"."tags" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"variant" text,
	"order" integer,
	"created_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "telegram"."tags_to_chats" (
	"tag_id" text NOT NULL,
	"chat_id" text NOT NULL,
	CONSTRAINT "tags_to_chats_tag_id_chat_id_pk" PRIMARY KEY("tag_id","chat_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "telegram"."tags_to_messages" (
	"tag_id" text NOT NULL,
	"message_id" text NOT NULL,
	CONSTRAINT "tags_to_messages_tag_id_message_id_pk" PRIMARY KEY("tag_id","message_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "telegram"."tags_to_users" (
	"tag_id" text NOT NULL,
	"user_id" text NOT NULL,
	CONSTRAINT "tags_to_users_tag_id_user_id_pk" PRIMARY KEY("tag_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "telegram"."messages" ADD COLUMN "document_id" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "telegram"."messages" ADD CONSTRAINT "messages_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "telegram"."documents"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "telegram"."tags_to_chats" ADD CONSTRAINT "tags_to_chats_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "telegram"."tags"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "telegram"."tags_to_chats" ADD CONSTRAINT "tags_to_chats_chat_id_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "telegram"."chats"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "telegram"."tags_to_messages" ADD CONSTRAINT "tags_to_messages_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "telegram"."tags"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "telegram"."tags_to_messages" ADD CONSTRAINT "tags_to_messages_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "telegram"."messages"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "telegram"."tags_to_users" ADD CONSTRAINT "tags_to_users_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "telegram"."tags"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "telegram"."tags_to_users" ADD CONSTRAINT "tags_to_users_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "telegram"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
