CREATE TABLE IF NOT EXISTS "telegram"."workspaces" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"user_id" text NOT NULL,
	"org_id" text NOT NULL,
	"created_at" timestamp
);
