CREATE TABLE "texts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document" uuid NOT NULL,
	"text" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "texts" ADD CONSTRAINT "texts_document_documents_id_fk" FOREIGN KEY ("document") REFERENCES "public"."documents"("id") ON DELETE no action ON UPDATE no action;