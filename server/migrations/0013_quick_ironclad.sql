ALTER TABLE "role_occupants" DROP CONSTRAINT "occupant_type";--> statement-breakpoint
ALTER TABLE "role_permissions" ADD COLUMN "organization_item" uuid;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_organization_item_organization_items_id_fk" FOREIGN KEY ("organization_item") REFERENCES "public"."organization_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_occupants" ADD CONSTRAINT "occupant_type" CHECK ((
		"role_occupants"."person" IS NULL AND
		"role_occupants"."organization_item" IS NULL AND
		"role_occupants"."organization_type" IS NULL AND
		"role_occupants"."membership_type" IS NULL
	) OR (
		"role_occupants"."person" IS NOT NULL AND
		"role_occupants"."organization_item" IS NULL AND
		"role_occupants"."organization_type" IS NULL AND
		"role_occupants"."membership_type" IS NULL
	) OR (
		"role_occupants"."person" IS NULL AND
		(
			(
				"role_occupants"."organization_item" IS NOT NULL AND
				"role_occupants"."organization_type" IS NULL
			) OR (
				"role_occupants"."organization_item" IS NULL AND
				"role_occupants"."organization_type" IS NOT NULL
			)
		)
	));