CREATE TABLE "workflow_allowed_initiators" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workflow" uuid NOT NULL,
	"person" uuid,
	"role" uuid,
	"organization_type" uuid,
	"organization_item" uuid
);
--> statement-breakpoint
ALTER TABLE "workflow_allowed_initiators" ADD CONSTRAINT "workflow_allowed_initiators_workflow_workflows_id_fk" FOREIGN KEY ("workflow") REFERENCES "public"."workflows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_allowed_initiators" ADD CONSTRAINT "workflow_allowed_initiators_person_persons_id_fk" FOREIGN KEY ("person") REFERENCES "public"."persons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_allowed_initiators" ADD CONSTRAINT "workflow_allowed_initiators_role_roles_id_fk" FOREIGN KEY ("role") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_allowed_initiators" ADD CONSTRAINT "workflow_allowed_initiators_organization_type_organization_types_id_fk" FOREIGN KEY ("organization_type") REFERENCES "public"."organization_types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_allowed_initiators" ADD CONSTRAINT "workflow_allowed_initiators_organization_item_organization_items_id_fk" FOREIGN KEY ("organization_item") REFERENCES "public"."organization_items"("id") ON DELETE cascade ON UPDATE no action;