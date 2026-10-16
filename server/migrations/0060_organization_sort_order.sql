ALTER TABLE "organization_items" ADD COLUMN "sort_order" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "organization_types" ADD COLUMN "sort_order" integer DEFAULT 0 NOT NULL;