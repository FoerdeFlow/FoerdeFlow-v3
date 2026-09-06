CREATE TABLE "workflow_process_drafts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workflow" uuid NOT NULL,
	"owner" uuid NOT NULL,
	"initiator_type" "workflow_initiator",
	"initiator_organization_item" uuid,
	"data" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"modified_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "workflow_process_drafts" ADD CONSTRAINT "workflow_process_drafts_workflow_workflows_id_fk" FOREIGN KEY ("workflow") REFERENCES "public"."workflows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_process_drafts" ADD CONSTRAINT "workflow_process_drafts_owner_persons_id_fk" FOREIGN KEY ("owner") REFERENCES "public"."persons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_process_drafts" ADD CONSTRAINT "workflow_process_drafts_initiator_organization_item_organization_items_id_fk" FOREIGN KEY ("initiator_organization_item") REFERENCES "public"."organization_items"("id") ON DELETE set null ON UPDATE no action;