ALTER TYPE "public"."bank_transaction_assignment_types" ADD VALUE 'transfer';--> statement-breakpoint
ALTER TABLE "bank_transaction_assignments" DROP CONSTRAINT "valid_type";--> statement-breakpoint
ALTER TABLE "bank_transaction_assignments" ADD CONSTRAINT "valid_type" CHECK ((
			"bank_transaction_assignments"."type" = 'planned' AND
			"bank_transaction_assignments"."budget_plan_item" IS NOT NULL AND
			"bank_transaction_assignments"."budget" IS NULL
		) OR (
			"bank_transaction_assignments"."type" = 'reserve' AND
			"bank_transaction_assignments"."budget" IS NOT NULL AND
			"bank_transaction_assignments"."budget_plan_item" IS NULL
		) OR (
			"bank_transaction_assignments"."type"::text = 'transfer' AND
			"bank_transaction_assignments"."budget" IS NULL AND
			"bank_transaction_assignments"."budget_plan_item" IS NULL AND
			"bank_transaction_assignments"."payment_order" IS NULL
		));