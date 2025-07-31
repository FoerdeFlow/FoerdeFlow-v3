ALTER TABLE "buildings" ALTER COLUMN "postal_address" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "organization_item" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_organization_item_organization_items_id_fk" FOREIGN KEY ("organization_item") REFERENCES "public"."organization_items"("id") ON DELETE no action ON UPDATE no action;