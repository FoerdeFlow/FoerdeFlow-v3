CREATE TYPE "public"."workflow_mutation_actions" AS ENUM('create', 'update', 'delete');--> statement-breakpoint
CREATE TYPE "public"."workflow_participants" AS ENUM('initiator', 'organizationItem');--> statement-breakpoint
CREATE TYPE "public"."workflow_statuses" AS ENUM('pending', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."workflow_step_statuses" AS ENUM('pending', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."workflow_step_types" AS ENUM('comment', 'approval', 'task');--> statement-breakpoint
CREATE TABLE "workflow_mutations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workflow" uuid NOT NULL,
	"table" varchar(64) NOT NULL,
	"action" "workflow_mutation_actions" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workflow_process_mutations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"process" uuid NOT NULL,
	"mutation" uuid NOT NULL,
	"data_id" uuid,
	"data" jsonb
);
--> statement-breakpoint
CREATE TABLE "workflow_process_steps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"process" uuid NOT NULL,
	"step" uuid NOT NULL,
	"status" "workflow_step_statuses" DEFAULT 'pending' NOT NULL,
	"comment" varchar(1024)
);
--> statement-breakpoint
CREATE TABLE "workflow_processes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workflow" uuid NOT NULL,
	"status" "workflow_statuses" DEFAULT 'pending' NOT NULL,
	"initiator_type" "workflow_participants" NOT NULL,
	"initiator_organization_item" uuid
);
--> statement-breakpoint
CREATE TABLE "workflow_steps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workflow" uuid NOT NULL,
	"stage" integer NOT NULL,
	"code" varchar(32) NOT NULL,
	"name" varchar(256) NOT NULL,
	"type" "workflow_step_types" NOT NULL,
	"assignee" "workflow_participants" NOT NULL,
	"assignee_organization_item" uuid
);
--> statement-breakpoint
ALTER TABLE "workflows" ADD COLUMN "code" varchar(32) NOT NULL;--> statement-breakpoint
ALTER TABLE "workflows" ADD COLUMN "name" varchar(256) NOT NULL;--> statement-breakpoint
ALTER TABLE "workflow_mutations" ADD CONSTRAINT "workflow_mutations_workflow_workflows_id_fk" FOREIGN KEY ("workflow") REFERENCES "public"."workflows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_process_mutations" ADD CONSTRAINT "workflow_process_mutations_process_workflow_processes_id_fk" FOREIGN KEY ("process") REFERENCES "public"."workflow_processes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_process_mutations" ADD CONSTRAINT "workflow_process_mutations_mutation_workflow_mutations_id_fk" FOREIGN KEY ("mutation") REFERENCES "public"."workflow_mutations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_process_steps" ADD CONSTRAINT "workflow_process_steps_process_workflow_processes_id_fk" FOREIGN KEY ("process") REFERENCES "public"."workflow_processes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_process_steps" ADD CONSTRAINT "workflow_process_steps_step_workflow_steps_id_fk" FOREIGN KEY ("step") REFERENCES "public"."workflow_steps"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_processes" ADD CONSTRAINT "workflow_processes_workflow_workflows_id_fk" FOREIGN KEY ("workflow") REFERENCES "public"."workflows"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_processes" ADD CONSTRAINT "workflow_processes_initiator_organization_item_organization_items_id_fk" FOREIGN KEY ("initiator_organization_item") REFERENCES "public"."organization_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_steps" ADD CONSTRAINT "workflow_steps_workflow_workflows_id_fk" FOREIGN KEY ("workflow") REFERENCES "public"."workflows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_steps" ADD CONSTRAINT "workflow_steps_assignee_organization_item_organization_items_id_fk" FOREIGN KEY ("assignee_organization_item") REFERENCES "public"."organization_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflows" DROP COLUMN "type";--> statement-breakpoint
DROP TYPE "public"."workflow_types";