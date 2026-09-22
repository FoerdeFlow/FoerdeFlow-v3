import { relations } from 'drizzle-orm'
import { pgTable, timestamp, unique, uuid, varchar } from 'drizzle-orm/pg-core'

import { eventTypes } from './event'
import { organizationItems } from './organizationItem'

/**
 * Ein Abo-Link auf den ICS-Feed. Der Token steht im Klartext in der Tabelle,
 * damit die Verwaltung die URL erneut anzeigen kann; er ist bewusst an keine
 * Person gebunden und berechtigt ausschließlich den Kalender-Endpunkt.
 */
export const calendarTokens = pgTable('calendar_tokens', {
	id: uuid().notNull().primaryKey().defaultRandom(),
	token: varchar({ length: 64 }).notNull().unique(),
	name: varchar({ length: 256 }).notNull(),
	createdAt: timestamp().notNull().defaultNow(),
	lastAccessedAt: timestamp(),
})

/**
 * Schränkt ein Abo auf bestimmte Terminarten ein. Ohne eine einzige Zeile
 * enthält der Feed alle Arten — eine leere Auswahl bedeutet also nicht
 * „nichts“, sondern „alles“.
 */
export const calendarTokenKinds = pgTable('calendar_token_kinds', {
	id: uuid().notNull().primaryKey().defaultRandom(),
	calendarToken: uuid().notNull().references(() => calendarTokens.id, { onDelete: 'cascade' }),
	// Leer steht für die Sitzungen: sie haben keine Veranstaltungsart, stehen in
	// der Auswahl aber neben den Arten.
	eventType: uuid().references(() => eventTypes.id),
}, (table) => [
	// `nullsNotDistinct`, damit die Sitzungszeile nur einmal vorkommen kann —
	// sonst gälten mehrere leere Zeilen als verschieden.
	unique('calendar_token_kind_unique')
		.on(table.calendarToken, table.eventType)
		.nullsNotDistinct(),
])

/**
 * Schränkt ein Abo auf bestimmte Gremien ein, und zwar auf genau die
 * angegebenen: untergeordnete Gremien kommen nicht von selbst hinzu. Ohne eine
 * einzige Zeile enthält der Feed alle Gremien.
 */
export const calendarTokenOrganizationItems = pgTable('calendar_token_organization_items', {
	id: uuid().notNull().primaryKey().defaultRandom(),
	calendarToken: uuid().notNull().references(() => calendarTokens.id, { onDelete: 'cascade' }),
	organizationItem: uuid().notNull().references(() => organizationItems.id),
}, (table) => [
	unique('calendar_token_organization_item_unique')
		.on(table.calendarToken, table.organizationItem),
])

export const calendarTokensRelations = relations(calendarTokens, ({ many }) => ({
	kinds: many(calendarTokenKinds),
	organizationItems: many(calendarTokenOrganizationItems),
}))

export const calendarTokenKindsRelations = relations(calendarTokenKinds, ({ one }) => ({
	calendarToken: one(calendarTokens, {
		fields: [ calendarTokenKinds.calendarToken ],
		references: [ calendarTokens.id ],
	}),
	eventType: one(eventTypes, {
		fields: [ calendarTokenKinds.eventType ],
		references: [ eventTypes.id ],
	}),
}))

export const calendarTokenOrganizationItemsRelations = relations(
	calendarTokenOrganizationItems,
	({ one }) => ({
		calendarToken: one(calendarTokens, {
			fields: [ calendarTokenOrganizationItems.calendarToken ],
			references: [ calendarTokens.id ],
		}),
		organizationItem: one(organizationItems, {
			fields: [ calendarTokenOrganizationItems.organizationItem ],
			references: [ organizationItems.id ],
		}),
	}),
)
