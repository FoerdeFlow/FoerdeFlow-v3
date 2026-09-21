CREATE TABLE "event_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(16) NOT NULL,
	"name" varchar(256) NOT NULL,
	CONSTRAINT "event_types_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_item" uuid NOT NULL,
	"type" uuid NOT NULL,
	"title" varchar(256) NOT NULL,
	"description" varchar(4096),
	"start_date" timestamp NOT NULL,
	"end_date" timestamp,
	"all_day" boolean DEFAULT false NOT NULL,
	"room" uuid NOT NULL,
	"cancelled" boolean DEFAULT false NOT NULL,
	CONSTRAINT "valid_event_range" CHECK ("events"."end_date" IS NULL OR "events"."end_date" >= "events"."start_date")
);
--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_organization_item_organization_items_id_fk" FOREIGN KEY ("organization_item") REFERENCES "public"."organization_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_type_event_types_id_fk" FOREIGN KEY ("type") REFERENCES "public"."event_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_room_rooms_id_fk" FOREIGN KEY ("room") REFERENCES "public"."rooms"("id") ON DELETE no action ON UPDATE no action;