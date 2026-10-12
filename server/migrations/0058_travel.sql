CREATE TYPE "public"."travel_claim_item_categories" AS ENUM('publicTransport', 'longDistance', 'seatReservation', 'privateCar', 'parking', 'vehicleExpenses', 'conferenceFee', 'training');--> statement-breakpoint
CREATE TYPE "public"."travel_permit_cars" AS ENUM('none', 'private', 'carsharing');--> statement-breakpoint
CREATE TYPE "public"."travel_permit_kinds" AS ENUM('single', 'general');--> statement-breakpoint
CREATE TYPE "public"."travel_permit_occasions" AS ENUM('parliamentSession', 'other');--> statement-breakpoint
CREATE TYPE "public"."travel_permit_special_interests" AS ENUM('none', 'campusTravel', 'centralBodySession', 'vehicleCosts', 'parliamentDecision');--> statement-breakpoint
CREATE TYPE "public"."travel_permit_traveler_bases" AS ENUM('officeHolder', 'employee', 'commissioned', 'sports', 'recognizedMember');--> statement-breakpoint
CREATE TYPE "public"."travel_permit_types" AS ENUM('planned', 'reserve');--> statement-breakpoint
CREATE TABLE "travel_claim_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"claim" uuid NOT NULL,
	"ord" integer NOT NULL,
	"traveler" uuid NOT NULL,
	"category" "travel_claim_item_categories" NOT NULL,
	"description" varchar(256) NOT NULL,
	"amount" numeric(16, 2) NOT NULL,
	"kilometers" integer,
	"event" varchar(256),
	"receipts" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "travel_claim_ord_unique" UNIQUE("claim","ord"),
	CONSTRAINT "valid_ord" CHECK ("travel_claim_items"."ord" >= 0),
	CONSTRAINT "amount_positive" CHECK ("travel_claim_items"."amount" > 0),
	CONSTRAINT "valid_kilometers" CHECK (("travel_claim_items"."category" = 'privateCar') = ("travel_claim_items"."kilometers" IS NOT NULL)),
	CONSTRAINT "valid_event" CHECK ("travel_claim_items"."category" IN ('conferenceFee', 'training') OR "travel_claim_items"."event" IS NULL)
);
--> statement-breakpoint
CREATE TABLE "travel_claims" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"permit" uuid NOT NULL,
	"recipient_person" uuid NOT NULL,
	"title" varchar(256),
	"destination" varchar(256),
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"amount" numeric(16, 2) NOT NULL,
	"advance_amount" numeric(16, 2),
	"payout_amount" numeric(16, 2) NOT NULL,
	"late" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "valid_date_range" CHECK ("travel_claims"."end_date" >= "travel_claims"."start_date"),
	CONSTRAINT "amount_not_negative" CHECK ("travel_claims"."amount" >= 0)
);
--> statement-breakpoint
CREATE TABLE "travel_permit_travelers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"permit" uuid NOT NULL,
	"ord" integer NOT NULL,
	"person" uuid NOT NULL,
	"amount" numeric(16, 2) NOT NULL,
	"driver" boolean DEFAULT false NOT NULL,
	CONSTRAINT "travel_permit_ord_unique" UNIQUE("permit","ord"),
	CONSTRAINT "travel_permit_person_unique" UNIQUE("permit","person"),
	CONSTRAINT "valid_ord" CHECK ("travel_permit_travelers"."ord" >= 0),
	CONSTRAINT "amount_not_negative" CHECK ("travel_permit_travelers"."amount" >= 0)
);
--> statement-breakpoint
CREATE TABLE "travel_permits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" "travel_permit_kinds" DEFAULT 'single' NOT NULL,
	"type" "travel_permit_types" DEFAULT 'planned' NOT NULL,
	"budget_plan_item" uuid,
	"budget" uuid,
	"title" varchar(256) NOT NULL,
	"description" varchar(1024),
	"destination" varchar(256) NOT NULL,
	"domestic" boolean DEFAULT true NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"occasion" "travel_permit_occasions" DEFAULT 'other' NOT NULL,
	"traveler_basis" "travel_permit_traveler_bases" NOT NULL,
	"special_interest" "travel_permit_special_interests" DEFAULT 'none' NOT NULL,
	"special_interest_reference" varchar(256),
	"long_distance" boolean DEFAULT false NOT NULL,
	"car" "travel_permit_cars" DEFAULT 'none' NOT NULL,
	"car_interest_reason" varchar(1024),
	"parking_fees_allowed" boolean DEFAULT false NOT NULL,
	"carsharing_estimate" numeric(16, 2),
	"advance_amount" numeric(16, 2),
	CONSTRAINT "valid_type" CHECK ((
			"travel_permits"."type" = 'planned' AND
			"travel_permits"."budget_plan_item" IS NOT NULL AND
			"travel_permits"."budget" IS NULL
		) OR (
			"travel_permits"."type" = 'reserve' AND
			"travel_permits"."budget" IS NOT NULL AND
			"travel_permits"."budget_plan_item" IS NULL
		)),
	CONSTRAINT "valid_date_range" CHECK ("travel_permits"."end_date" >= "travel_permits"."start_date"),
	CONSTRAINT "valid_special_interest" CHECK ("travel_permits"."special_interest" <> 'parliamentDecision' OR "travel_permits"."special_interest_reference" IS NOT NULL),
	CONSTRAINT "valid_car" CHECK (("travel_permits"."car" = 'none') = ("travel_permits"."car_interest_reason" IS NULL)),
	CONSTRAINT "valid_carsharing_estimate" CHECK ("travel_permits"."carsharing_estimate" IS NULL OR (
			"travel_permits"."car" = 'carsharing' AND "travel_permits"."carsharing_estimate" >= 0
		)),
	CONSTRAINT "valid_parking_fees" CHECK ("travel_permits"."car" <> 'none' OR NOT "travel_permits"."parking_fees_allowed"),
	CONSTRAINT "valid_advance" CHECK ("travel_permits"."advance_amount" IS NULL OR (
			"travel_permits"."kind" = 'single' AND "travel_permits"."advance_amount" > 0
		))
);
--> statement-breakpoint
CREATE TABLE "vehicle_driver_qualifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"person" uuid NOT NULL,
	"license_class" varchar(16) NOT NULL,
	"license_checked_at" date NOT NULL,
	"license_checked_by" uuid NOT NULL,
	"instructed_at" date,
	"instructed_by" uuid,
	CONSTRAINT "vehicle_driver_person_unique" UNIQUE("person"),
	CONSTRAINT "valid_instruction" CHECK (("vehicle_driver_qualifications"."instructed_at" IS NULL) = ("vehicle_driver_qualifications"."instructed_by" IS NULL))
);
--> statement-breakpoint
ALTER TABLE "travel_claim_items" ADD CONSTRAINT "travel_claim_items_claim_travel_claims_id_fk" FOREIGN KEY ("claim") REFERENCES "public"."travel_claims"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "travel_claim_items" ADD CONSTRAINT "travel_claim_items_traveler_persons_id_fk" FOREIGN KEY ("traveler") REFERENCES "public"."persons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "travel_claims" ADD CONSTRAINT "travel_claims_permit_travel_permits_id_fk" FOREIGN KEY ("permit") REFERENCES "public"."travel_permits"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "travel_claims" ADD CONSTRAINT "travel_claims_recipient_person_persons_id_fk" FOREIGN KEY ("recipient_person") REFERENCES "public"."persons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "travel_permit_travelers" ADD CONSTRAINT "travel_permit_travelers_permit_travel_permits_id_fk" FOREIGN KEY ("permit") REFERENCES "public"."travel_permits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "travel_permit_travelers" ADD CONSTRAINT "travel_permit_travelers_person_persons_id_fk" FOREIGN KEY ("person") REFERENCES "public"."persons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "travel_permits" ADD CONSTRAINT "travel_permits_budget_plan_item_budget_plan_items_id_fk" FOREIGN KEY ("budget_plan_item") REFERENCES "public"."budget_plan_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "travel_permits" ADD CONSTRAINT "travel_permits_budget_budgets_id_fk" FOREIGN KEY ("budget") REFERENCES "public"."budgets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_driver_qualifications" ADD CONSTRAINT "vehicle_driver_qualifications_person_persons_id_fk" FOREIGN KEY ("person") REFERENCES "public"."persons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_driver_qualifications" ADD CONSTRAINT "vehicle_driver_qualifications_license_checked_by_persons_id_fk" FOREIGN KEY ("license_checked_by") REFERENCES "public"."persons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_driver_qualifications" ADD CONSTRAINT "vehicle_driver_qualifications_instructed_by_persons_id_fk" FOREIGN KEY ("instructed_by") REFERENCES "public"."persons"("id") ON DELETE no action ON UPDATE no action;