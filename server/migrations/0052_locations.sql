-- Die Kürzel der Gebäude und der Räume waren je für sich global eindeutig,
-- teilen sich ab jetzt aber eine Spalte. Lieber hier mit einer klaren Meldung
-- abbrechen als weiter unten an einem Unique-Verstoß.
DO $$
DECLARE
	collision text;
BEGIN
	SELECT string_agg(code, ', ') INTO collision
	FROM (SELECT code FROM buildings INTERSECT SELECT code FROM rooms) AS conflicting;
	IF collision IS NOT NULL THEN
		RAISE EXCEPTION 'Gebäude und Räume teilen sich die Kürzel: %', collision;
	END IF;
END $$;--> statement-breakpoint
CREATE TYPE "public"."location_types" AS ENUM('building', 'room', 'place', 'external', 'online', 'adHoc');--> statement-breakpoint
CREATE TABLE "locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "location_types" NOT NULL,
	"parent" uuid,
	"organization_item" uuid,
	"code" varchar(16),
	"name" varchar(256) NOT NULL,
	"level" integer,
	"capacity" integer,
	"postal_address" varchar(256),
	"url" varchar(1024),
	CONSTRAINT "locations_code_unique" UNIQUE("code"),
	CONSTRAINT "valid_location_type" CHECK ((
			"locations"."type" IN ('building', 'place', 'external') AND
			"locations"."parent" IS NULL AND
			"locations"."organization_item" IS NULL AND
			"locations"."level" IS NULL AND
			"locations"."postal_address" IS NOT NULL AND
			"locations"."url" IS NULL
		) OR (
			"locations"."type" = 'room' AND
			"locations"."parent" IS NOT NULL AND
			"locations"."organization_item" IS NULL AND
			"locations"."level" IS NOT NULL AND
			"locations"."postal_address" IS NULL AND
			"locations"."url" IS NULL
		) OR (
			"locations"."type" = 'online' AND
			"locations"."parent" IS NULL AND
			"locations"."organization_item" IS NULL AND
			"locations"."level" IS NULL AND
			"locations"."capacity" IS NULL AND
			"locations"."postal_address" IS NULL AND
			"locations"."url" IS NOT NULL
		) OR (
			"locations"."type" = 'adHoc' AND
			"locations"."parent" IS NULL AND
			"locations"."organization_item" IS NOT NULL AND
			"locations"."code" IS NULL AND
			"locations"."level" IS NULL AND
			"locations"."capacity" IS NULL
		)),
	CONSTRAINT "capacity_positive" CHECK ("locations"."capacity" IS NULL OR "locations"."capacity" > 0)
);
--> statement-breakpoint
ALTER TABLE "locations" ADD CONSTRAINT "locations_parent_locations_id_fk" FOREIGN KEY ("parent") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "locations" ADD CONSTRAINT "locations_organization_item_organization_items_id_fk" FOREIGN KEY ("organization_item") REFERENCES "public"."organization_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
-- Die Kennungen werden übernommen, damit die Termine und Sitzungen weiter auf
-- denselben Ort zeigen und keine Fremdschlüssel umgeschrieben werden müssen.
INSERT INTO "locations" ("id", "type", "code", "name", "postal_address")
SELECT "id", 'building', "code", "name", "postal_address" FROM "buildings";--> statement-breakpoint
-- Räume ohne erfasste Kapazität standen bisher auf 0, was der neue Check
-- verbietet. Eine unbekannte Kapazität ist jetzt NULL.
INSERT INTO "locations" ("id", "type", "parent", "code", "name", "level", "capacity")
SELECT "id", 'room', "building", "code", "name", "level",
	CASE WHEN "capacity" > 0 THEN "capacity" END
FROM "rooms";--> statement-breakpoint
ALTER TABLE "events" DROP CONSTRAINT "events_room_rooms_id_fk";--> statement-breakpoint
ALTER TABLE "sessions" DROP CONSTRAINT "sessions_room_rooms_id_fk";--> statement-breakpoint
DROP TABLE "rooms";--> statement-breakpoint
DROP TABLE "buildings";--> statement-breakpoint
ALTER TABLE "events" RENAME COLUMN "room" TO "location";--> statement-breakpoint
ALTER TABLE "sessions" RENAME COLUMN "room" TO "location";--> statement-breakpoint
ALTER TABLE "events" ALTER COLUMN "location" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "online_location" uuid;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "online_location" uuid;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_location_locations_id_fk" FOREIGN KEY ("location") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_online_location_locations_id_fk" FOREIGN KEY ("online_location") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_location_locations_id_fk" FOREIGN KEY ("location") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_online_location_locations_id_fk" FOREIGN KEY ("online_location") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
-- Hatte eine Rolle dasselbe Recht für Gebäude und für Räume, bliebe nach dem
-- Umbenennen eine Dublette übrig, die der Unique-Constraint verbietet.
DELETE FROM "role_permissions" AS a
USING "role_permissions" AS b
WHERE a."permission" LIKE 'rooms.%'
	AND b."permission" = 'buildings.' || split_part(a."permission", '.', 2)
	AND a."role" = b."role"
	AND a."organization_item" IS NOT DISTINCT FROM b."organization_item";--> statement-breakpoint
UPDATE "role_permissions"
SET "permission" = 'locations.' || split_part("permission", '.', 2)
WHERE "permission" LIKE 'buildings.%' OR "permission" LIKE 'rooms.%';
