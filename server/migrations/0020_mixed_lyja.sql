CREATE TYPE "public"."workflow_initiator" AS ENUM('person', 'organizationItem');--> statement-breakpoint
ALTER TABLE "workflow_processes" ALTER COLUMN "initiator_type" SET DATA TYPE "public"."workflow_initiator" USING "initiator_type"::text::"public"."workflow_initiator";--> statement-breakpoint
ALTER TABLE "workflow_processes" ADD COLUMN "initiator_person" uuid;--> statement-breakpoint
ALTER TABLE "workflows" ADD COLUMN "description" varchar(1024);--> statement-breakpoint
ALTER TABLE "workflow_processes" ADD CONSTRAINT "workflow_processes_initiator_person_persons_id_fk" FOREIGN KEY ("initiator_person") REFERENCES "public"."persons"("id") ON DELETE no action ON UPDATE no action;