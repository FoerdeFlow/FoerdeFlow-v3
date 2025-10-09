ALTER TABLE "budget_plan_items" ADD COLUMN "ord" integer;--> statement-breakpoint
ALTER TABLE "budget_plan_items" ADD CONSTRAINT "plan_ord_unique" UNIQUE("plan","ord");--> statement-breakpoint
ALTER TABLE "budget_plan_items" ADD CONSTRAINT "valid_ord" CHECK ("budget_plan_items"."ord" >= 0);