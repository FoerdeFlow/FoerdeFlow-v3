ALTER TABLE "role_occupants" ALTER COLUMN "person" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "role_occupants" ALTER COLUMN "organization_type" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "role_occupants" ALTER COLUMN "organization_item" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "role_occupants" ALTER COLUMN "membership_type" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "role_occupants" ADD CONSTRAINT "occupant_type" CHECK ((
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