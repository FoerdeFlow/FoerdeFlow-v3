CREATE TABLE "calendar_token_kinds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"calendar_token" uuid NOT NULL,
	"event_type" uuid,
	CONSTRAINT "calendar_token_kind_unique" UNIQUE NULLS NOT DISTINCT("calendar_token","event_type")
);
--> statement-breakpoint
CREATE TABLE "calendar_token_organization_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"calendar_token" uuid NOT NULL,
	"organization_item" uuid NOT NULL,
	CONSTRAINT "calendar_token_organization_item_unique" UNIQUE("calendar_token","organization_item")
);
--> statement-breakpoint
ALTER TABLE "calendar_token_kinds" ADD CONSTRAINT "calendar_token_kinds_calendar_token_calendar_tokens_id_fk" FOREIGN KEY ("calendar_token") REFERENCES "public"."calendar_tokens"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_token_kinds" ADD CONSTRAINT "calendar_token_kinds_event_type_event_types_id_fk" FOREIGN KEY ("event_type") REFERENCES "public"."event_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_token_organization_items" ADD CONSTRAINT "calendar_token_organization_items_calendar_token_calendar_tokens_id_fk" FOREIGN KEY ("calendar_token") REFERENCES "public"."calendar_tokens"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_token_organization_items" ADD CONSTRAINT "calendar_token_organization_items_organization_item_organization_items_id_fk" FOREIGN KEY ("organization_item") REFERENCES "public"."organization_items"("id") ON DELETE no action ON UPDATE no action;