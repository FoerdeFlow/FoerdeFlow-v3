import { pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'

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
