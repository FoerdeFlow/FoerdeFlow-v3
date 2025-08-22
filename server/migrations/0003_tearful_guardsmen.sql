CREATE TABLE "organization_item_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_item" uuid NOT NULL,
	"group_name" varchar(256) NOT NULL,
	"participant_organization_item" uuid NOT NULL,
	"participant_membership_type" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "organization_item_participants" ADD CONSTRAINT "organization_item_participants_organization_item_organization_items_id_fk" FOREIGN KEY ("organization_item") REFERENCES "public"."organization_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_item_participants" ADD CONSTRAINT "organization_item_participants_participant_organization_item_organization_items_id_fk" FOREIGN KEY ("participant_organization_item") REFERENCES "public"."organization_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_item_participants" ADD CONSTRAINT "organization_item_participants_participant_membership_type_membership_types_id_fk" FOREIGN KEY ("participant_membership_type") REFERENCES "public"."membership_types"("id") ON DELETE no action ON UPDATE no action;