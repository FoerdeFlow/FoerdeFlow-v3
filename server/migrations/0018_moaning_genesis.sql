CREATE TABLE "expense_authorization_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"expense_authorization" uuid NOT NULL,
	"ord" integer,
	"title" varchar(256) NOT NULL,
	"description" varchar(1024),
	"amount" numeric(16, 2) NOT NULL,
	CONSTRAINT "expense_authorization_ord_unique" UNIQUE("expense_authorization","ord"),
	CONSTRAINT "valid_ord" CHECK ("expense_authorization_items"."ord" >= 0)
);
--> statement-breakpoint
CREATE TABLE "expense_authorizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"budget_plan_item" uuid NOT NULL,
	"title" varchar(256) NOT NULL,
	"description" varchar(1024),
	"amount" numeric(16, 2) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "expense_authorization_items" ADD CONSTRAINT "expense_authorization_items_expense_authorization_expense_authorizations_id_fk" FOREIGN KEY ("expense_authorization") REFERENCES "public"."expense_authorizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_authorizations" ADD CONSTRAINT "expense_authorizations_budget_plan_item_budget_plan_items_id_fk" FOREIGN KEY ("budget_plan_item") REFERENCES "public"."budget_plan_items"("id") ON DELETE no action ON UPDATE no action;