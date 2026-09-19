UPDATE "longterm_contract_items" SET "ord" = "filled"."ord" FROM (
	SELECT
		"id",
		COALESCE((
			SELECT MAX("sibling"."ord") / 10 * 10
			FROM "longterm_contract_items" "sibling"
			WHERE "sibling"."longterm_contract" = "item"."longterm_contract"
		), 0) + 10 * ROW_NUMBER() OVER (
			PARTITION BY "item"."longterm_contract" ORDER BY "item"."title"
		) AS "ord"
	FROM "longterm_contract_items" "item"
	WHERE "item"."ord" IS NULL
) AS "filled" WHERE "longterm_contract_items"."id" = "filled"."id";--> statement-breakpoint
UPDATE "representation_allowance_recipients" SET "ord" = "filled"."ord" FROM (
	SELECT
		"id",
		COALESCE((
			SELECT MAX("sibling"."ord") / 10 * 10
			FROM "representation_allowance_recipients" "sibling"
			WHERE "sibling"."representation_allowance" = "recipient"."representation_allowance"
		), 0) + 10 * ROW_NUMBER() OVER (
			PARTITION BY "recipient"."representation_allowance" ORDER BY "recipient"."person"
		) AS "ord"
	FROM "representation_allowance_recipients" "recipient"
	WHERE "recipient"."ord" IS NULL
) AS "filled" WHERE "representation_allowance_recipients"."id" = "filled"."id";--> statement-breakpoint
ALTER TABLE "longterm_contract_items" ALTER COLUMN "ord" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "representation_allowance_recipients" ALTER COLUMN "ord" SET NOT NULL;
