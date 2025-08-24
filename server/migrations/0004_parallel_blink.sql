CREATE TABLE "organization_item_group_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_item_group" uuid NOT NULL,
	"organization_item" uuid NOT NULL,
	"membership_type" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization_item_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_item" uuid NOT NULL,
	"group_name" varchar(256) NOT NULL,
	"role_name" varchar(256) NOT NULL,
	"is_session_participant" boolean NOT NULL
);
--> statement-breakpoint
DROP TABLE "organization_item_participants" CASCADE;--> statement-breakpoint
ALTER TABLE "organization_item_group_members" ADD CONSTRAINT "organization_item_group_members_organization_item_group_organization_item_groups_id_fk" FOREIGN KEY ("organization_item_group") REFERENCES "public"."organization_item_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_item_group_members" ADD CONSTRAINT "organization_item_group_members_organization_item_organization_items_id_fk" FOREIGN KEY ("organization_item") REFERENCES "public"."organization_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_item_group_members" ADD CONSTRAINT "organization_item_group_members_membership_type_membership_types_id_fk" FOREIGN KEY ("membership_type") REFERENCES "public"."membership_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_item_groups" ADD CONSTRAINT "organization_item_groups_organization_item_organization_items_id_fk" FOREIGN KEY ("organization_item") REFERENCES "public"."organization_items"("id") ON DELETE no action ON UPDATE no action;