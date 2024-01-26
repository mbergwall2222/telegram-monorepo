CREATE TABLE IF NOT EXISTS "telegram"."workspaces_to_chats" (
	"workspace_id" text NOT NULL,
	"chat_id" text NOT NULL,
	CONSTRAINT "workspaces_to_chats_workspace_id_chat_id_pk" PRIMARY KEY("workspace_id","chat_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "telegram"."workspaces_to_messages" (
	"workspace_id" text NOT NULL,
	"message_id" text NOT NULL,
	CONSTRAINT "workspaces_to_messages_workspace_id_message_id_pk" PRIMARY KEY("workspace_id","message_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "telegram"."workspaces_to_users" (
	"workspace_id" text NOT NULL,
	"user_id" text NOT NULL,
	CONSTRAINT "workspaces_to_users_workspace_id_user_id_pk" PRIMARY KEY("workspace_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "telegram"."chats" ADD COLUMN "workspace_ids" text[] DEFAULT array[]::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "telegram"."messages" ADD COLUMN "workspace_ids" text[] DEFAULT array[]::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "telegram"."users" ADD COLUMN "workspace_ids" text[] DEFAULT array[]::text[] NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "workspaces_to_chats_idx" ON "telegram"."workspaces_to_chats" ("chat_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "workspaces_to_messages_idx" ON "telegram"."workspaces_to_messages" ("message_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "workspaces_to_users_idx" ON "telegram"."workspaces_to_users" ("user_id");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "telegram"."workspaces_to_chats" ADD CONSTRAINT "workspaces_to_chats_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "telegram"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "telegram"."workspaces_to_chats" ADD CONSTRAINT "workspaces_to_chats_chat_id_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "telegram"."chats"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "telegram"."workspaces_to_messages" ADD CONSTRAINT "workspaces_to_messages_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "telegram"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "telegram"."workspaces_to_messages" ADD CONSTRAINT "workspaces_to_messages_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "telegram"."messages"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "telegram"."workspaces_to_users" ADD CONSTRAINT "workspaces_to_users_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "telegram"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "telegram"."workspaces_to_users" ADD CONSTRAINT "workspaces_to_users_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "telegram"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
