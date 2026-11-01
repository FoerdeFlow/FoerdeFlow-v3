ALTER TYPE "public"."workflow_participants" ADD VALUE 'referencedOrganizationItem';--> statement-breakpoint
ALTER TABLE "workflow_signatures" ADD COLUMN "assignee_referenced_organization_item" varchar(256);--> statement-breakpoint
ALTER TABLE "workflow_steps" ADD COLUMN "assignee_referenced_organization_item" varchar(256);