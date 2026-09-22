import { relations, sql } from 'drizzle-orm'
import {
	type AnyPgColumn,
	check,
	integer,
	pgEnum,
	pgTable,
	uuid,
	varchar,
} from 'drizzle-orm/pg-core'

import { organizationItems } from './organizationItem'

export const locationTypes = pgEnum('location_types', [
	// Ein Gebäude der Hochschule. Trägt die Anschrift für die Räume darin.
	'building',
	// Ein Raum in einem Gebäude.
	'room',
	// Ein Platz oder eine Freifläche mit eigener Anschrift.
	'place',
	// Ein hochschulexterner Ort, etwa ein Tagungshaus.
	'external',
	// Ein Videokonferenzraum.
	'online',
	// Ein noch nicht geprüfter Ort, beim Termin nebenbei erfasst.
	'adHoc',
])

/**
 * Ein Ort, an dem eine Sitzung oder eine Veranstaltung stattfindet.
 *
 * Alle Ortsarten liegen in einer Tabelle, weil ein Termin auf genau einen Ort
 * zeigt und dabei nicht wissen soll, ob es ein Raum, ein Platz oder eine
 * Kneipe ist. Welche Spalten eine Art füllen darf, regelt `valid_location_type`.
 *
 * Ein Ad-hoc-Ort entsteht, wenn beim Anlegen eines Termins der passende Ort
 * noch fehlt. Er gehört dem Gremium, das ihn angelegt hat, und taucht nirgends
 * sonst in der Auswahl auf, bis ihn jemand mit `locations.update` in eine
 * richtige Art überführt oder mit einem bestehenden Ort zusammenführt.
 */
export const locations = pgTable('locations', {
	id: uuid().notNull().primaryKey().defaultRandom(),
	type: locationTypes().notNull(),
	// Nur bei einem Raum gesetzt: das Gebäude, in dem er liegt.
	parent: uuid().references((): AnyPgColumn => locations.id),
	// Nur bei einem Ad-hoc-Ort gesetzt: das Gremium, das ihn angelegt hat.
	organizationItem: uuid().references(() => organizationItems.id),
	code: varchar({ length: 16 }).unique(),
	name: varchar({ length: 256 }).notNull(),
	// Das Stockwerk eines Raums. Negative Werte stehen für das Untergeschoss.
	level: integer(),
	capacity: integer(),
	postalAddress: varchar({ length: 256 }),
	url: varchar({ length: 1024 }),
}, (table) => [
	check(
		'valid_location_type',
		sql`(
			${table.type} IN ('building', 'place', 'external') AND
			${table.parent} IS NULL AND
			${table.organizationItem} IS NULL AND
			${table.level} IS NULL AND
			${table.postalAddress} IS NOT NULL AND
			${table.url} IS NULL
		) OR (
			${table.type} = 'room' AND
			${table.parent} IS NOT NULL AND
			${table.organizationItem} IS NULL AND
			${table.level} IS NOT NULL AND
			${table.postalAddress} IS NULL AND
			${table.url} IS NULL
		) OR (
			${table.type} = 'online' AND
			${table.parent} IS NULL AND
			${table.organizationItem} IS NULL AND
			${table.level} IS NULL AND
			${table.capacity} IS NULL AND
			${table.postalAddress} IS NULL AND
			${table.url} IS NOT NULL
		) OR (
			${table.type} = 'adHoc' AND
			${table.parent} IS NULL AND
			${table.organizationItem} IS NOT NULL AND
			${table.code} IS NULL AND
			${table.level} IS NULL AND
			${table.capacity} IS NULL
		)`,
	),
	check(
		'capacity_positive',
		sql`${table.capacity} IS NULL OR ${table.capacity} > 0`,
	),
])

export const locationsRelations = relations(locations, ({ one, many }) => ({
	parent: one(locations, {
		fields: [ locations.parent ],
		references: [ locations.id ],
		relationName: 'parent',
	}),
	children: many(locations, {
		relationName: 'parent',
	}),
	organizationItem: one(organizationItems, {
		fields: [ locations.organizationItem ],
		references: [ organizationItems.id ],
	}),
}))
