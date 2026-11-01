CREATE TABLE "travel_transport_reason_modes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reason" uuid NOT NULL,
	"transport_mode" uuid NOT NULL,
	CONSTRAINT "travel_transport_reason_mode_unique" UNIQUE("reason","transport_mode")
);
--> statement-breakpoint
CREATE TABLE "travel_transport_reason_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reason" uuid NOT NULL,
	"role" uuid NOT NULL,
	CONSTRAINT "travel_transport_reason_role_unique" UNIQUE("reason","role")
);
--> statement-breakpoint
ALTER TABLE "travel_transport_reasons" DROP CONSTRAINT "travel_transport_reason_code_unique";--> statement-breakpoint
ALTER TABLE "travel_transport_reasons" DROP CONSTRAINT "travel_transport_reason_transport_mode_fk";
--> statement-breakpoint
ALTER TABLE "travel_transport_reason_modes" ADD CONSTRAINT "travel_transport_reason_mode_reason_fk" FOREIGN KEY ("reason") REFERENCES "public"."travel_transport_reasons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "travel_transport_reason_modes" ADD CONSTRAINT "travel_transport_reason_mode_transport_mode_fk" FOREIGN KEY ("transport_mode") REFERENCES "public"."travel_transport_modes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "travel_transport_reason_roles" ADD CONSTRAINT "travel_transport_reason_roles_role_travel_roles_id_fk" FOREIGN KEY ("role") REFERENCES "public"."travel_roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "travel_transport_reason_roles" ADD CONSTRAINT "travel_transport_reason_role_reason_fk" FOREIGN KEY ("reason") REFERENCES "public"."travel_transport_reasons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "travel_transport_reasons" DROP COLUMN "transport_mode";--> statement-breakpoint
ALTER TABLE "travel_transport_reasons" ADD CONSTRAINT "travel_transport_reason_code_unique" UNIQUE("code");