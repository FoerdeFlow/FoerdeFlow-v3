ALTER TABLE "budget_plan_items" DROP CONSTRAINT "budget_plan_items_plan_budget_plans_id_fk";
--> statement-breakpoint
ALTER TABLE "budget_plan_items" ADD CONSTRAINT "budget_plan_items_plan_budget_plans_id_fk" FOREIGN KEY ("plan") REFERENCES "public"."budget_plans"("id") ON DELETE cascade ON UPDATE no action;