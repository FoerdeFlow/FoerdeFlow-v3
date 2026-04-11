ALTER TABLE "workflow_process_steps" ADD COLUMN "modified_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "workflow_process_steps" ADD COLUMN "reminder_sent_at" timestamp;--> statement-breakpoint
ALTER TABLE "workflow_processes" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "workflow_steps" ADD COLUMN "reminder_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "workflow_steps" ADD COLUMN "reminder_interval" integer DEFAULT 604800 NOT NULL;--> statement-breakpoint
ALTER TABLE "workflow_steps" ADD COLUMN "reminder_delay" integer DEFAULT 259200 NOT NULL;--> statement-breakpoint
ALTER TABLE "workflow_steps" ADD COLUMN "reminder_message" varchar(2048) DEFAULT 'Du hast eine anstehende Aufgabe.' NOT NULL;