CREATE TYPE "public"."longterm_contract_item_types" AS ENUM('time', 'usage', 'fixed');--> statement-breakpoint
CREATE TYPE "public"."longterm_contract_time_units" AS ENUM('month', 'quarter', 'semester', 'year');--> statement-breakpoint
CREATE TABLE "longterm_contract_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"longterm_contract" uuid NOT NULL,
	"ord" integer,
	"type" "longterm_contract_item_types" DEFAULT 'time' NOT NULL,
	"title" varchar(256) NOT NULL,
	"description" varchar(1024),
	"amount" numeric(16, 2) NOT NULL,
	"time_unit" "longterm_contract_time_units",
	"usage_unit" varchar(64),
	"expected_usage" numeric(16, 2),
	CONSTRAINT "longterm_contract_ord_unique" UNIQUE("longterm_contract","ord"),
	CONSTRAINT "valid_ord" CHECK ("longterm_contract_items"."ord" >= 0),
	CONSTRAINT "amount_positive" CHECK ("longterm_contract_items"."amount" > 0),
	CONSTRAINT "expected_usage_positive" CHECK ("longterm_contract_items"."expected_usage" > 0),
	CONSTRAINT "valid_type" CHECK ((
			"longterm_contract_items"."type" = 'time' AND
			"longterm_contract_items"."time_unit" IS NOT NULL AND
			"longterm_contract_items"."usage_unit" IS NULL AND
			"longterm_contract_items"."expected_usage" IS NULL
		) OR (
			"longterm_contract_items"."type" = 'usage' AND
			"longterm_contract_items"."usage_unit" IS NOT NULL AND
			"longterm_contract_items"."expected_usage" IS NOT NULL AND
			"longterm_contract_items"."time_unit" IS NOT NULL
		) OR (
			"longterm_contract_items"."type" = 'fixed' AND
			"longterm_contract_items"."time_unit" IS NULL AND
			"longterm_contract_items"."usage_unit" IS NULL AND
			"longterm_contract_items"."expected_usage" IS NULL
		))
);
--> statement-breakpoint
CREATE TABLE "longterm_contracts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"budget" uuid NOT NULL,
	"title" varchar(256) NOT NULL,
	"description" varchar(1024),
	"start_date" date NOT NULL,
	"end_date" date,
	CONSTRAINT "valid_date_range" CHECK ("longterm_contracts"."end_date" IS NULL OR "longterm_contracts"."end_date" > "longterm_contracts"."start_date")
);
--> statement-breakpoint
ALTER TABLE "longterm_contract_items" ADD CONSTRAINT "longterm_contract_items_longterm_contract_longterm_contracts_id_fk" FOREIGN KEY ("longterm_contract") REFERENCES "public"."longterm_contracts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "longterm_contracts" ADD CONSTRAINT "longterm_contracts_budget_budgets_id_fk" FOREIGN KEY ("budget") REFERENCES "public"."budgets"("id") ON DELETE no action ON UPDATE no action;