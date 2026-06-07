import { relations } from 'drizzle-orm'
import { pgTable, text, uuid } from 'drizzle-orm/pg-core'
import { documents } from './document'

export const texts = pgTable('texts', {
	id: uuid().notNull().primaryKey().defaultRandom(),
	document: uuid().references(() => documents.id).notNull(),
	text: text().notNull(),
})

export const textsRelations = relations(texts, ({ one }) => ({
	document: one(documents, {
		fields: [texts.document],
		references: [documents.id],
	}),
}))
