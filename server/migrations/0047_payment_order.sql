CREATE TYPE "public"."payment_order_recipient_types" AS ENUM('reimbursement', 'invoice');--> statement-breakpoint
CREATE TYPE "public"."payment_order_types" AS ENUM('planned', 'reserve');--> statement-breakpoint
CREATE TABLE "payment_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "payment_order_types" DEFAULT 'planned' NOT NULL,
	"budget_plan_item" uuid,
	"budget" uuid,
	"expense_authorization" uuid,
	"recipient_type" "payment_order_recipient_types" DEFAULT 'reimbursement' NOT NULL,
	"recipient_person" uuid,
	"recipient_name" varchar(256),
	"recipient_iban" varchar(34),
	"purpose" varchar(256),
	"title" varchar(256) NOT NULL,
	"description" varchar(1024),
	"amount" numeric(16, 2) NOT NULL,
	CONSTRAINT "valid_type" CHECK ((
			"payment_orders"."type" = 'planned' AND
			"payment_orders"."budget_plan_item" IS NOT NULL AND
			"payment_orders"."budget" IS NULL
		) OR (
			"payment_orders"."type" = 'reserve' AND
			"payment_orders"."budget" IS NOT NULL AND
			"payment_orders"."budget_plan_item" IS NULL
		)),
	CONSTRAINT "valid_recipient_type" CHECK ((
			"payment_orders"."recipient_type" = 'reimbursement' AND
			"payment_orders"."recipient_person" IS NOT NULL AND
			"payment_orders"."recipient_name" IS NULL AND
			"payment_orders"."recipient_iban" IS NULL AND
			"payment_orders"."purpose" IS NULL
		) OR (
			"payment_orders"."recipient_type" = 'invoice' AND
			"payment_orders"."recipient_person" IS NULL AND
			"payment_orders"."recipient_name" IS NOT NULL AND
			"payment_orders"."recipient_iban" IS NOT NULL AND
			"payment_orders"."purpose" IS NOT NULL
		)),
	CONSTRAINT "amount_positive" CHECK ("payment_orders"."amount" > 0)
);
--> statement-breakpoint
ALTER TABLE "payment_orders" ADD CONSTRAINT "payment_orders_budget_plan_item_budget_plan_items_id_fk" FOREIGN KEY ("budget_plan_item") REFERENCES "public"."budget_plan_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_orders" ADD CONSTRAINT "payment_orders_budget_budgets_id_fk" FOREIGN KEY ("budget") REFERENCES "public"."budgets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_orders" ADD CONSTRAINT "payment_orders_expense_authorization_expense_authorizations_id_fk" FOREIGN KEY ("expense_authorization") REFERENCES "public"."expense_authorizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_orders" ADD CONSTRAINT "payment_orders_recipient_person_persons_id_fk" FOREIGN KEY ("recipient_person") REFERENCES "public"."persons"("id") ON DELETE no action ON UPDATE no action;