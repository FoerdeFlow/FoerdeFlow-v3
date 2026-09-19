UPDATE "budget_plan_items" SET "ord" = "filled"."ord" FROM (
	SELECT
		"id",
		COALESCE((
			SELECT MAX("sibling"."ord") / 10 * 10
			FROM "budget_plan_items" "sibling"
			WHERE "sibling"."plan" = "item"."plan"
		), 0) + 10 * ROW_NUMBER() OVER (PARTITION BY "item"."plan" ORDER BY "item"."title") AS "ord"
	FROM "budget_plan_items" "item"
	WHERE "item"."ord" IS NULL
) AS "filled" WHERE "budget_plan_items"."id" = "filled"."id";--> statement-breakpoint
UPDATE "expense_authorization_items" SET "ord" = "filled"."ord" FROM (
	SELECT
		"id",
		COALESCE((
			SELECT MAX("sibling"."ord") / 10 * 10
			FROM "expense_authorization_items" "sibling"
			WHERE "sibling"."expense_authorization" = "item"."expense_authorization"
		), 0) + 10 * ROW_NUMBER() OVER (
			PARTITION BY "item"."expense_authorization" ORDER BY "item"."title"
		) AS "ord"
	FROM "expense_authorization_items" "item"
	WHERE "item"."ord" IS NULL
) AS "filled" WHERE "expense_authorization_items"."id" = "filled"."id";--> statement-breakpoint
ALTER TABLE "budget_plan_items" ALTER COLUMN "ord" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "expense_authorization_items" ALTER COLUMN "ord" SET NOT NULL;
