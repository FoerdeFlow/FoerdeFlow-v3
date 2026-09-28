-- Das Kürzel eines Raums gilt nur auf seinem Stockwerk: dieselbe Nummer gibt es
-- in jedem Gebäude und auf jeder Etage noch einmal. Die bisherige Eindeutigkeit
-- über alle Orte hinweg bleibt für alles außer Räumen bestehen.
ALTER TABLE "locations" DROP CONSTRAINT "locations_code_unique";--> statement-breakpoint
CREATE UNIQUE INDEX "room_code_unique" ON "locations" USING btree ("parent","level","code") WHERE "locations"."type" = 'room';--> statement-breakpoint
CREATE UNIQUE INDEX "location_code_unique" ON "locations" USING btree ("code") WHERE "locations"."type" <> 'room';
