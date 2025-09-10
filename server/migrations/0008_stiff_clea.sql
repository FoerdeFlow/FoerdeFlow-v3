CREATE TYPE "public"."session_attendance_statuses" AS ENUM('present', 'absent', 'excused', 'late');--> statement-breakpoint
CREATE TABLE "session_attendances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session" uuid NOT NULL,
	"person" uuid NOT NULL,
	"status" "session_attendance_statuses" NOT NULL
);
--> statement-breakpoint
ALTER TABLE "session_attendances" ADD CONSTRAINT "session_attendances_session_sessions_id_fk" FOREIGN KEY ("session") REFERENCES "public"."sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_attendances" ADD CONSTRAINT "session_attendances_person_persons_id_fk" FOREIGN KEY ("person") REFERENCES "public"."persons"("id") ON DELETE no action ON UPDATE no action;