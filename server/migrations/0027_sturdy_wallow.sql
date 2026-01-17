CREATE TABLE "candidates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"election_proposal" uuid NOT NULL,
	"candidate" uuid NOT NULL,
	"application_letter" varchar(2048)
);
--> statement-breakpoint
CREATE TABLE "election_committees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"election" uuid NOT NULL,
	"committee" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "election_proposals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"election_committee" uuid NOT NULL,
	"submitter" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "elections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(256) NOT NULL,
	"date" date NOT NULL
);
--> statement-breakpoint
CREATE TABLE "councils" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(16) NOT NULL,
	"name" varchar(256) NOT NULL,
	CONSTRAINT "councils_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(16) NOT NULL,
	"name" varchar(256) NOT NULL,
	"council" uuid NOT NULL,
	"department" uuid NOT NULL,
	CONSTRAINT "courses_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "departments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(16) NOT NULL,
	"name" varchar(256) NOT NULL,
	CONSTRAINT "departments_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "persons" ADD COLUMN "matriculation_number" integer;--> statement-breakpoint
ALTER TABLE "persons" ADD COLUMN "course" uuid;--> statement-breakpoint
ALTER TABLE "persons" ADD COLUMN "postal_address" varchar(256);--> statement-breakpoint
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_election_proposal_election_proposals_id_fk" FOREIGN KEY ("election_proposal") REFERENCES "public"."election_proposals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_candidate_persons_id_fk" FOREIGN KEY ("candidate") REFERENCES "public"."persons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "election_committees" ADD CONSTRAINT "election_committees_election_elections_id_fk" FOREIGN KEY ("election") REFERENCES "public"."elections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "election_committees" ADD CONSTRAINT "election_committees_committee_organization_items_id_fk" FOREIGN KEY ("committee") REFERENCES "public"."organization_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "election_proposals" ADD CONSTRAINT "election_proposals_election_committee_election_committees_id_fk" FOREIGN KEY ("election_committee") REFERENCES "public"."election_committees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "election_proposals" ADD CONSTRAINT "election_proposals_submitter_persons_id_fk" FOREIGN KEY ("submitter") REFERENCES "public"."persons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_council_councils_id_fk" FOREIGN KEY ("council") REFERENCES "public"."councils"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_department_departments_id_fk" FOREIGN KEY ("department") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "persons" ADD CONSTRAINT "persons_course_courses_id_fk" FOREIGN KEY ("course") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;