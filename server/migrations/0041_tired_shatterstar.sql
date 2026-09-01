CREATE TYPE "public"."representation_allowance_period_units" AS ENUM('month', 'once');--> statement-breakpoint
CREATE TABLE "representation_allowance_recipients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"representation_allowance" uuid NOT NULL,
	"ord" integer,
	"person" uuid NOT NULL,
	"amount" numeric(16, 2) NOT NULL,
	CONSTRAINT "representation_allowance_ord_unique" UNIQUE("representation_allowance","ord") DEFERRABLE INITIALLY DEFERRED,
	CONSTRAINT "representation_allowance_person_unique" UNIQUE("representation_allowance","person") DEFERRABLE INITIALLY DEFERRED,
	CONSTRAINT "valid_ord" CHECK ("representation_allowance_recipients"."ord" >= 0),
	CONSTRAINT "amount_positive" CHECK ("representation_allowance_recipients"."amount" > 0)
);
--> statement-breakpoint
CREATE TABLE "representation_allowances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_item" uuid NOT NULL,
	"title" varchar(256) NOT NULL,
	"description" varchar(1024),
	"period_unit" "representation_allowance_period_units" DEFAULT 'month' NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	CONSTRAINT "valid_date_range" CHECK ("representation_allowances"."end_date" IS NULL OR "representation_allowances"."end_date" > "representation_allowances"."start_date"),
	CONSTRAINT "valid_period_unit" CHECK ("representation_allowances"."period_unit" <> 'once' OR "representation_allowances"."end_date" IS NULL)
);
--> statement-breakpoint
ALTER TABLE "representation_allowance_recipients" ADD CONSTRAINT "representation_allowance_recipients_representation_allowance_representation_allowances_id_fk" FOREIGN KEY ("representation_allowance") REFERENCES "public"."representation_allowances"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "representation_allowance_recipients" ADD CONSTRAINT "representation_allowance_recipients_person_persons_id_fk" FOREIGN KEY ("person") REFERENCES "public"."persons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "representation_allowances" ADD CONSTRAINT "representation_allowances_organization_item_organization_items_id_fk" FOREIGN KEY ("organization_item") REFERENCES "public"."organization_items"("id") ON DELETE no action ON UPDATE no action;
