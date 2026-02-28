ALTER TABLE "elections" ADD COLUMN "email" varchar(256) NOT NULL;--> statement-breakpoint
ALTER TABLE "elections" ADD CONSTRAINT "elections_email_unique" UNIQUE("email");
