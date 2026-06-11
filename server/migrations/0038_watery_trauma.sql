CREATE TYPE "public"."expense_authorization_types" AS ENUM('planned', 'reserve');--> statement-breakpoint
ALTER TABLE "expense_authorizations" ALTER COLUMN "budget_plan_item" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "expense_authorizations" ADD COLUMN "type" "expense_authorization_types" DEFAULT 'planned' NOT NULL;--> statement-breakpoint
ALTER TABLE "expense_authorizations" ADD COLUMN "budget" uuid;--> statement-breakpoint
ALTER TABLE "expense_authorizations" ADD CONSTRAINT "expense_authorizations_budget_budgets_id_fk" FOREIGN KEY ("budget") REFERENCES "public"."budgets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_authorizations" ADD CONSTRAINT "valid_type" CHECK ((
			"expense_authorizations"."type" = 'planned' AND
			"expense_authorizations"."budget_plan_item" IS NOT NULL AND
			"expense_authorizations"."budget" IS NULL
		) OR (
			"expense_authorizations"."type" = 'reserve' AND
			"expense_authorizations"."budget" IS NOT NULL AND
			"expense_authorizations"."budget_plan_item" IS NULL
		));