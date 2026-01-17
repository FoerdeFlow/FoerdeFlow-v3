CREATE TABLE "course_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(16) NOT NULL,
	"name" varchar(256) NOT NULL,
	CONSTRAINT "course_types_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "type" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_type_course_types_id_fk" FOREIGN KEY ("type") REFERENCES "public"."course_types"("id") ON DELETE no action ON UPDATE no action;