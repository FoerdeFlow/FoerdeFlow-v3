import { pgTable, uuid, varchar } from 'drizzle-orm/pg-core'

export const announcements = pgTable('announcements', {
	id: uuid().notNull().primaryKey().defaultRandom(),
	title: varchar({ length: 256 }).notNull(),
	text: varchar({ length: 4096 }).notNull(),
})
