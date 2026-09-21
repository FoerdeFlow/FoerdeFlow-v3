import { relations, sql } from 'drizzle-orm'
import {
	boolean,
	check,
	pgTable,
	timestamp,
	uuid,
	varchar,
} from 'drizzle-orm/pg-core'

import { rooms } from './building'
import { organizationItems } from './organizationItem'

export const eventTypes = pgTable('event_types', {
	id: uuid().notNull().primaryKey().defaultRandom(),
	code: varchar({ length: 16 }).notNull().unique(),
	name: varchar({ length: 256 }).notNull(),
})

/**
 * Eine Veranstaltung eines Gremiums. Anders als eine Sitzung wird sie direkt
 * angelegt, ohne Nummernkreis und ohne Prozess.
 *
 * Ist `allDay` gesetzt, stehen `startDate` und `endDate` jeweils auf 00:00 Uhr,
 * und `endDate` benennt den letzten Tag einschließlich: ein eintägiger Termin
 * hat gar kein Enddatum, ein dreitägiger endet zwei Tage nach dem Beginn.
 */
export const events = pgTable('events', {
	id: uuid().notNull().primaryKey().defaultRandom(),
	organizationItem: uuid().notNull().references(() => organizationItems.id),
	type: uuid().notNull().references(() => eventTypes.id),
	title: varchar({ length: 256 }).notNull(),
	description: varchar({ length: 4096 }),
	startDate: timestamp().notNull(),
	endDate: timestamp(),
	allDay: boolean().notNull().default(false),
	room: uuid().notNull().references(() => rooms.id),
	cancelled: boolean().notNull().default(false),
}, (table) => [
	check(
		'valid_event_range',
		sql`${table.endDate} IS NULL OR ${table.endDate} >= ${table.startDate}`,
	),
])

export const eventsRelations = relations(events, ({ one }) => ({
	organizationItem: one(organizationItems, {
		fields: [ events.organizationItem ],
		references: [ organizationItems.id ],
	}),
	type: one(eventTypes, {
		fields: [ events.type ],
		references: [ eventTypes.id ],
	}),
	room: one(rooms, {
		fields: [ events.room ],
		references: [ rooms.id ],
	}),
}))
