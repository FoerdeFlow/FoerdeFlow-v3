CREATE TYPE "public"."bank_transaction_assignment_types" AS ENUM('planned', 'reserve');--> statement-breakpoint
CREATE TYPE "public"."bank_transaction_directions" AS ENUM('credit', 'debit');--> statement-breakpoint
CREATE TABLE "bank_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_item" uuid NOT NULL,
	"name" varchar(256) NOT NULL,
	"iban" varchar(34) NOT NULL,
	CONSTRAINT "bank_account_iban_unique" UNIQUE("iban")
);
--> statement-breakpoint
CREATE TABLE "bank_statements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bank_account" uuid NOT NULL,
	"statement_id" varchar(35) NOT NULL,
	"sequence_number" varchar(18),
	"created_at" timestamp NOT NULL,
	"from_date" date,
	"to_date" date,
	"opening_balance" numeric(16, 2),
	"closing_balance" numeric(16, 2),
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	"uploaded_by" uuid,
	CONSTRAINT "bank_statement_unique" UNIQUE("bank_account","statement_id")
);
--> statement-breakpoint
CREATE TABLE "bank_transaction_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transaction" uuid NOT NULL,
	"type" "bank_transaction_assignment_types" DEFAULT 'planned' NOT NULL,
	"budget_plan_item" uuid,
	"budget" uuid,
	"payment_order" uuid,
	"amount" numeric(16, 2) NOT NULL,
	"note" varchar(256),
	CONSTRAINT "valid_type" CHECK ((
			"bank_transaction_assignments"."type" = 'planned' AND
			"bank_transaction_assignments"."budget_plan_item" IS NOT NULL AND
			"bank_transaction_assignments"."budget" IS NULL
		) OR (
			"bank_transaction_assignments"."type" = 'reserve' AND
			"bank_transaction_assignments"."budget" IS NOT NULL AND
			"bank_transaction_assignments"."budget_plan_item" IS NULL
		)),
	CONSTRAINT "amount_positive" CHECK ("bank_transaction_assignments"."amount" > 0)
);
--> statement-breakpoint
CREATE TABLE "bank_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bank_account" uuid NOT NULL,
	"statement" uuid NOT NULL,
	"import_key" varchar(128) NOT NULL,
	"booking_date" date NOT NULL,
	"value_date" date,
	"direction" "bank_transaction_directions" NOT NULL,
	"amount" numeric(16, 2) NOT NULL,
	"reversal" boolean DEFAULT false NOT NULL,
	"counterparty_name" varchar(140),
	"counterparty_iban" varchar(34),
	"purpose" varchar(1024),
	"end_to_end_id" varchar(35),
	"account_servicer_reference" varchar(35),
	"additional_info" varchar(500),
	CONSTRAINT "bank_transaction_import_key_unique" UNIQUE("bank_account","import_key"),
	CONSTRAINT "amount_positive" CHECK ("bank_transactions"."amount" > 0)
);
--> statement-breakpoint
ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_organization_item_organization_items_id_fk" FOREIGN KEY ("organization_item") REFERENCES "public"."organization_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_statements" ADD CONSTRAINT "bank_statements_bank_account_bank_accounts_id_fk" FOREIGN KEY ("bank_account") REFERENCES "public"."bank_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_statements" ADD CONSTRAINT "bank_statements_uploaded_by_persons_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."persons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_transaction_assignments" ADD CONSTRAINT "bank_transaction_assignments_budget_budgets_id_fk" FOREIGN KEY ("budget") REFERENCES "public"."budgets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_transaction_assignments" ADD CONSTRAINT "bank_transaction_assignments_payment_order_payment_orders_id_fk" FOREIGN KEY ("payment_order") REFERENCES "public"."payment_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_transaction_assignments" ADD CONSTRAINT "bank_transaction_assignment_transaction_fk" FOREIGN KEY ("transaction") REFERENCES "public"."bank_transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_transaction_assignments" ADD CONSTRAINT "bank_transaction_assignment_budget_plan_item_fk" FOREIGN KEY ("budget_plan_item") REFERENCES "public"."budget_plan_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_transactions" ADD CONSTRAINT "bank_transactions_bank_account_bank_accounts_id_fk" FOREIGN KEY ("bank_account") REFERENCES "public"."bank_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_transactions" ADD CONSTRAINT "bank_transactions_statement_bank_statements_id_fk" FOREIGN KEY ("statement") REFERENCES "public"."bank_statements"("id") ON DELETE no action ON UPDATE no action;