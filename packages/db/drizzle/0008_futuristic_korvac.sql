ALTER TABLE "telegram"."workspaces_to_chats" ADD COLUMN "id" text;--> statement-breakpoint
ALTER TABLE "telegram"."workspaces_to_messages" ADD COLUMN "id" text;--> statement-breakpoint
ALTER TABLE "telegram"."workspaces_to_users" ADD COLUMN "id" text;