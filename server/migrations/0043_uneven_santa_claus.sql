CREATE TYPE "public"."workflow_paper_statuses" AS ENUM('notRequired', 'pending', 'received');--> statement-breakpoint
CREATE TYPE "public"."workflow_signature_statuses" AS ENUM('pending', 'received');--> statement-breakpoint
CREATE TABLE "workflow_process_signatures" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"process" uuid NOT NULL,
	"signature" uuid NOT NULL,
	"status" "workflow_signature_statuses" DEFAULT 'pending' NOT NULL,
	"comment" varchar(1024),
	"confirmed_by" uuid,
	"confirmed_at" timestamp,
	"modified_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "workflow_process_signature_unique" UNIQUE("process","signature")
);
--> statement-breakpoint
CREATE TABLE "workflow_signatures" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workflow" uuid NOT NULL,
	"mutation" uuid NOT NULL,
	"stage" integer NOT NULL,
	"code" varchar(32) NOT NULL,
	"name" varchar(256) NOT NULL,
	"description" varchar(1024),
	"hint" varchar(1024),
	"lines" jsonb NOT NULL,
	"assignee" "workflow_participants" NOT NULL,
	"assignee_referenced_person" varchar(256),
	"assignee_organization_item" uuid
);
--> statement-breakpoint
ALTER TABLE "workflow_processes" ADD COLUMN "paper_status" "workflow_paper_statuses" DEFAULT 'notRequired' NOT NULL;--> statement-breakpoint
ALTER TABLE "workflow_process_signatures" ADD CONSTRAINT "workflow_process_signatures_process_workflow_processes_id_fk" FOREIGN KEY ("process") REFERENCES "public"."workflow_processes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_process_signatures" ADD CONSTRAINT "workflow_process_signatures_signature_workflow_signatures_id_fk" FOREIGN KEY ("signature") REFERENCES "public"."workflow_signatures"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_process_signatures" ADD CONSTRAINT "workflow_process_signatures_confirmed_by_persons_id_fk" FOREIGN KEY ("confirmed_by") REFERENCES "public"."persons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_signatures" ADD CONSTRAINT "workflow_signatures_workflow_workflows_id_fk" FOREIGN KEY ("workflow") REFERENCES "public"."workflows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_signatures" ADD CONSTRAINT "workflow_signatures_mutation_workflow_mutations_id_fk" FOREIGN KEY ("mutation") REFERENCES "public"."workflow_mutations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_signatures" ADD CONSTRAINT "workflow_signatures_assignee_organization_item_organization_items_id_fk" FOREIGN KEY ("assignee_organization_item") REFERENCES "public"."organization_items"("id") ON DELETE no action ON UPDATE no action;