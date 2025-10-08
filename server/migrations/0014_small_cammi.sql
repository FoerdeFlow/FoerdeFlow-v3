CREATE TYPE "public"."workflow_types" AS ENUM('');--> statement-breakpoint
CREATE TABLE "budget_plan_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan" uuid NOT NULL,
	"title" varchar(256) NOT NULL,
	"description" varchar(1024) NOT NULL,
	"revenues" numeric(16, 2) NOT NULL,
	"expenses" numeric(16, 2) NOT NULL,
	CONSTRAINT "revenues_non_negative" CHECK ("budget_plan_items"."revenues" >= 0),
	CONSTRAINT "expenses_non_negative" CHECK ("budget_plan_items"."expenses" >= 0),
	CONSTRAINT "revenues_or_expenses_positive" CHECK ("budget_plan_items"."revenues" > 0 OR "budget_plan_items"."expenses" > 0)
);
--> statement-breakpoint
CREATE TABLE "budget_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"budget" uuid NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	CONSTRAINT "valid_date_range" CHECK ("budget_plans"."end_date" > "budget_plans"."start_date")
);
--> statement-breakpoint
CREATE TABLE "budgets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_item" uuid NOT NULL,
	"code" varchar(16) NOT NULL,
	"name" varchar(256) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workflows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "workflow_types" DEFAULT '' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "budget_plan_items" ADD CONSTRAINT "budget_plan_items_plan_budget_plans_id_fk" FOREIGN KEY ("plan") REFERENCES "public"."budget_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_plans" ADD CONSTRAINT "budget_plans_budget_budgets_id_fk" FOREIGN KEY ("budget") REFERENCES "public"."budgets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_organization_item_organization_items_id_fk" FOREIGN KEY ("organization_item") REFERENCES "public"."organization_items"("id") ON DELETE no action ON UPDATE no action;