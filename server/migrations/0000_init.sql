CREATE TYPE "public"."member_types" AS ENUM('person', 'organization_item');--> statement-breakpoint
CREATE TABLE "buildings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(16) NOT NULL,
	"name" varchar(256) NOT NULL,
	"postal_address" varchar(256),
	CONSTRAINT "buildings_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "membership_end_reasons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(32) NOT NULL,
	"name" varchar(256) NOT NULL,
	CONSTRAINT "membership_end_reasons_code_unique" UNIQUE("code"),
	CONSTRAINT "membership_end_reasons_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "membership_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(32) NOT NULL,
	"name" varchar(256) NOT NULL,
	CONSTRAINT "membership_types_code_unique" UNIQUE("code"),
	CONSTRAINT "membership_types_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_item" uuid NOT NULL,
	"membership_type" uuid NOT NULL,
	"comment" varchar(1024),
	"start_date" timestamp,
	"end_date" timestamp,
	"end_reason" uuid,
	"member_type" "member_types" NOT NULL,
	"member_person" uuid,
	"member_organization_item" uuid,
	CONSTRAINT "member_type" CHECK ((
		"memberships"."member_type" = 'person' AND
		"memberships"."member_person" IS NOT NULL AND
		"memberships"."member_organization_item" IS NULL
	) OR (
		"memberships"."member_type" = 'organization_item' AND
		"memberships"."member_organization_item" IS NOT NULL AND
		"memberships"."member_person" IS NULL
	)),
	CONSTRAINT "date_order" CHECK ("memberships"."start_date" IS NULL OR "memberships"."end_date" IS NULL OR "memberships"."start_date" < "memberships"."end_date")
);
--> statement-breakpoint
CREATE TABLE "organization_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_type" uuid NOT NULL,
	"parent" uuid,
	"code" varchar(32) NOT NULL,
	"name" varchar(256) NOT NULL,
	CONSTRAINT "organization_items_code_unique" UNIQUE("code"),
	CONSTRAINT "organization_items_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "organization_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(32) NOT NULL,
	"name" varchar(256) NOT NULL,
	CONSTRAINT "organization_types_code_unique" UNIQUE("code"),
	CONSTRAINT "organization_types_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "persons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(256) NOT NULL,
	"first_name" varchar(256) NOT NULL,
	"last_name" varchar(256) NOT NULL,
	"call_name" varchar(256),
	"pronouns" varchar(256),
	CONSTRAINT "persons_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "rooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"building" uuid NOT NULL,
	"level" integer NOT NULL,
	"code" varchar(16) NOT NULL,
	"name" varchar(256) NOT NULL,
	"capacity" integer NOT NULL,
	CONSTRAINT "rooms_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"period" integer NOT NULL,
	"number" integer NOT NULL,
	"planned_date" timestamp NOT NULL,
	"start_date" timestamp,
	"end_date" timestamp,
	"room" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_organization_item_organization_items_id_fk" FOREIGN KEY ("organization_item") REFERENCES "public"."organization_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_membership_type_membership_types_id_fk" FOREIGN KEY ("membership_type") REFERENCES "public"."membership_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_end_reason_membership_end_reasons_id_fk" FOREIGN KEY ("end_reason") REFERENCES "public"."membership_end_reasons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_member_person_persons_id_fk" FOREIGN KEY ("member_person") REFERENCES "public"."persons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_member_organization_item_organization_items_id_fk" FOREIGN KEY ("member_organization_item") REFERENCES "public"."organization_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_items" ADD CONSTRAINT "organization_items_organization_type_organization_types_id_fk" FOREIGN KEY ("organization_type") REFERENCES "public"."organization_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_items" ADD CONSTRAINT "organization_items_parent_organization_items_id_fk" FOREIGN KEY ("parent") REFERENCES "public"."organization_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_building_buildings_id_fk" FOREIGN KEY ("building") REFERENCES "public"."buildings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_room_rooms_id_fk" FOREIGN KEY ("room") REFERENCES "public"."rooms"("id") ON DELETE no action ON UPDATE no action;