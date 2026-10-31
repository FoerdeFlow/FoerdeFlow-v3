CREATE TYPE "public"."travel_permit_types" AS ENUM('planned', 'reserve');--> statement-breakpoint
CREATE TABLE "travel_advances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"permit" uuid NOT NULL,
	"amount" numeric(16, 2) NOT NULL,
	CONSTRAINT "travel_advance_permit_unique" UNIQUE("permit"),
	CONSTRAINT "amount_positive" CHECK ("travel_advances"."amount" > 0)
);
--> statement-breakpoint
CREATE TABLE "travel_claim_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"claim" uuid NOT NULL,
	"ord" integer NOT NULL,
	"permit_item" uuid NOT NULL,
	"description" varchar(256),
	"amount" numeric(16, 2) NOT NULL,
	CONSTRAINT "travel_claim_item_ord_unique" UNIQUE("claim","ord"),
	CONSTRAINT "valid_ord" CHECK ("travel_claim_items"."ord" >= 0),
	CONSTRAINT "amount_positive" CHECK ("travel_claim_items"."amount" > 0)
);
--> statement-breakpoint
CREATE TABLE "travel_claims" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"permit" uuid NOT NULL,
	"requested_amount" numeric(16, 2) NOT NULL,
	"amount" numeric(16, 2) NOT NULL,
	"payout_amount" numeric(16, 2) NOT NULL,
	CONSTRAINT "travel_claim_permit_unique" UNIQUE("permit"),
	CONSTRAINT "valid_amount" CHECK ("travel_claims"."amount" >= 0 AND "travel_claims"."amount" <= "travel_claims"."requested_amount")
);
--> statement-breakpoint
CREATE TABLE "travel_cost_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(16) NOT NULL,
	"name" varchar(256) NOT NULL,
	CONSTRAINT "travel_cost_type_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "travel_permit_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"permit" uuid NOT NULL,
	"ord" integer NOT NULL,
	"cost_type" uuid NOT NULL,
	"description" varchar(1024),
	"amount" numeric(16, 2) NOT NULL,
	CONSTRAINT "travel_permit_item_ord_unique" UNIQUE("permit","ord"),
	CONSTRAINT "valid_ord" CHECK ("travel_permit_items"."ord" >= 0),
	CONSTRAINT "amount_positive" CHECK ("travel_permit_items"."amount" > 0)
);
--> statement-breakpoint
CREATE TABLE "travel_permits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"traveler" uuid NOT NULL,
	"role" uuid NOT NULL,
	"special_allocation" uuid,
	"title" varchar(256) NOT NULL,
	"description" varchar(1024),
	"origin" varchar(256) NOT NULL,
	"destination" varchar(256) NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"transport_mode" uuid NOT NULL,
	"transport_reason" uuid,
	"type" "travel_permit_types" DEFAULT 'planned' NOT NULL,
	"budget_plan_item" uuid,
	"budget" uuid,
	"amount" numeric(16, 2) NOT NULL,
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
	CONSTRAINT "amount_positive" CHECK ("travel_permits"."amount" > 0)
);
--> statement-breakpoint
CREATE TABLE "travel_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(16) NOT NULL,
	"name" varchar(256) NOT NULL,
	"organization_item" uuid NOT NULL,
	"budget" uuid NOT NULL,
	CONSTRAINT "travel_role_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "travel_special_allocations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(16) NOT NULL,
	"name" varchar(256) NOT NULL,
	"budget" uuid NOT NULL,
	CONSTRAINT "travel_special_allocation_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "travel_transport_modes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(16) NOT NULL,
	"name" varchar(256) NOT NULL,
	"reason_required" boolean DEFAULT false NOT NULL,
	CONSTRAINT "travel_transport_mode_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "travel_transport_reasons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transport_mode" uuid NOT NULL,
	"code" varchar(16) NOT NULL,
	"name" varchar(256) NOT NULL,
	CONSTRAINT "travel_transport_reason_code_unique" UNIQUE("transport_mode","code")
);
--> statement-breakpoint
ALTER TABLE "bank_transaction_assignments" DROP CONSTRAINT "valid_type";--> statement-breakpoint
ALTER TABLE "bank_transaction_assignments" ADD COLUMN "travel_advance" uuid;--> statement-breakpoint
ALTER TABLE "bank_transaction_assignments" ADD COLUMN "travel_claim" uuid;--> statement-breakpoint
ALTER TABLE "travel_advances" ADD CONSTRAINT "travel_advances_permit_travel_permits_id_fk" FOREIGN KEY ("permit") REFERENCES "public"."travel_permits"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "travel_claim_items" ADD CONSTRAINT "travel_claim_items_claim_travel_claims_id_fk" FOREIGN KEY ("claim") REFERENCES "public"."travel_claims"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "travel_claim_items" ADD CONSTRAINT "travel_claim_items_permit_item_travel_permit_items_id_fk" FOREIGN KEY ("permit_item") REFERENCES "public"."travel_permit_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "travel_claims" ADD CONSTRAINT "travel_claims_permit_travel_permits_id_fk" FOREIGN KEY ("permit") REFERENCES "public"."travel_permits"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "travel_permit_items" ADD CONSTRAINT "travel_permit_items_permit_travel_permits_id_fk" FOREIGN KEY ("permit") REFERENCES "public"."travel_permits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "travel_permit_items" ADD CONSTRAINT "travel_permit_items_cost_type_travel_cost_types_id_fk" FOREIGN KEY ("cost_type") REFERENCES "public"."travel_cost_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "travel_permits" ADD CONSTRAINT "travel_permits_traveler_persons_id_fk" FOREIGN KEY ("traveler") REFERENCES "public"."persons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "travel_permits" ADD CONSTRAINT "travel_permits_role_travel_roles_id_fk" FOREIGN KEY ("role") REFERENCES "public"."travel_roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "travel_permits" ADD CONSTRAINT "travel_permits_transport_mode_travel_transport_modes_id_fk" FOREIGN KEY ("transport_mode") REFERENCES "public"."travel_transport_modes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "travel_permits" ADD CONSTRAINT "travel_permits_transport_reason_travel_transport_reasons_id_fk" FOREIGN KEY ("transport_reason") REFERENCES "public"."travel_transport_reasons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "travel_permits" ADD CONSTRAINT "travel_permits_budget_plan_item_budget_plan_items_id_fk" FOREIGN KEY ("budget_plan_item") REFERENCES "public"."budget_plan_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "travel_permits" ADD CONSTRAINT "travel_permits_budget_budgets_id_fk" FOREIGN KEY ("budget") REFERENCES "public"."budgets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "travel_permits" ADD CONSTRAINT "travel_permit_special_allocation_fk" FOREIGN KEY ("special_allocation") REFERENCES "public"."travel_special_allocations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "travel_roles" ADD CONSTRAINT "travel_roles_organization_item_organization_items_id_fk" FOREIGN KEY ("organization_item") REFERENCES "public"."organization_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "travel_roles" ADD CONSTRAINT "travel_roles_budget_budgets_id_fk" FOREIGN KEY ("budget") REFERENCES "public"."budgets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "travel_special_allocations" ADD CONSTRAINT "travel_special_allocations_budget_budgets_id_fk" FOREIGN KEY ("budget") REFERENCES "public"."budgets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "travel_transport_reasons" ADD CONSTRAINT "travel_transport_reason_transport_mode_fk" FOREIGN KEY ("transport_mode") REFERENCES "public"."travel_transport_modes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_transaction_assignments" ADD CONSTRAINT "bank_transaction_assignment_travel_advance_fk" FOREIGN KEY ("travel_advance") REFERENCES "public"."travel_advances"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_transaction_assignments" ADD CONSTRAINT "bank_transaction_assignment_travel_claim_fk" FOREIGN KEY ("travel_claim") REFERENCES "public"."travel_claims"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_transaction_assignments" ADD CONSTRAINT "single_document" CHECK (num_nonnulls(
			"bank_transaction_assignments"."payment_order",
			"bank_transaction_assignments"."travel_advance",
			"bank_transaction_assignments"."travel_claim"
		) <= 1);--> statement-breakpoint
ALTER TABLE "bank_transaction_assignments" ADD CONSTRAINT "valid_type" CHECK ((
			"bank_transaction_assignments"."type" = 'planned' AND
			"bank_transaction_assignments"."budget_plan_item" IS NOT NULL AND
			"bank_transaction_assignments"."budget" IS NULL
		) OR (
			"bank_transaction_assignments"."type" = 'reserve' AND
			"bank_transaction_assignments"."budget" IS NOT NULL AND
			"bank_transaction_assignments"."budget_plan_item" IS NULL
		) OR (
			"bank_transaction_assignments"."type"::text = 'transfer' AND
			"bank_transaction_assignments"."budget" IS NULL AND
			"bank_transaction_assignments"."budget_plan_item" IS NULL AND
			"bank_transaction_assignments"."payment_order" IS NULL AND
			"bank_transaction_assignments"."travel_advance" IS NULL AND
			"bank_transaction_assignments"."travel_claim" IS NULL
		));