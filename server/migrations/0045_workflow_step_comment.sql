ALTER TABLE "workflow_steps" ADD COLUMN "comment_required" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "workflow_steps" ADD COLUMN "comment_label" varchar(256);