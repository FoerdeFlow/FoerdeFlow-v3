CREATE TABLE "inventory_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_item" uuid NOT NULL,
	"inventory_number" varchar(16),
	"name" varchar(256) NOT NULL,
	"description" varchar(4096),
	"location" uuid,
	CONSTRAINT "inventory_item_number" UNIQUE("organization_item","inventory_number")
);
--> statement-breakpoint
CREATE TABLE "inventory_loans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item" uuid NOT NULL,
	"borrower" uuid NOT NULL,
	"lent_at" timestamp NOT NULL,
	"due_at" timestamp NOT NULL,
	"returned_at" timestamp,
	"lent_by" uuid,
	"returned_to" uuid,
	"note" varchar(4096),
	CONSTRAINT "valid_loan_range" CHECK (
			"inventory_loans"."due_at" >= "inventory_loans"."lent_at" AND
			("inventory_loans"."returned_at" IS NULL OR "inventory_loans"."returned_at" >= "inventory_loans"."lent_at")
		),
	CONSTRAINT "valid_loan_return" CHECK ("inventory_loans"."returned_to" IS NULL OR "inventory_loans"."returned_at" IS NOT NULL)
);
--> statement-breakpoint
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_organization_item_organization_items_id_fk" FOREIGN KEY ("organization_item") REFERENCES "public"."organization_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_location_locations_id_fk" FOREIGN KEY ("location") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_loans" ADD CONSTRAINT "inventory_loans_item_inventory_items_id_fk" FOREIGN KEY ("item") REFERENCES "public"."inventory_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_loans" ADD CONSTRAINT "inventory_loans_borrower_persons_id_fk" FOREIGN KEY ("borrower") REFERENCES "public"."persons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_loans" ADD CONSTRAINT "inventory_loans_lent_by_persons_id_fk" FOREIGN KEY ("lent_by") REFERENCES "public"."persons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_loans" ADD CONSTRAINT "inventory_loans_returned_to_persons_id_fk" FOREIGN KEY ("returned_to") REFERENCES "public"."persons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "one_open_loan_per_item" ON "inventory_loans" USING btree ("item") WHERE "inventory_loans"."returned_at" is null;