import { pgTable, uuid, integer, varchar } from 'drizzle-orm/pg-core'

import { relations } from 'drizzle-orm'
import { organizationItems } from './organizationItem'
import { persons } from './person'

export const documentTypes = pgTable('document_types', {
	id: uuid().notNull().primaryKey().defaultRandom(),
	code: varchar({ length: 64 }).notNull().unique(),
	name: varchar({ length: 256 }).notNull(),
})

export const documents = pgTable('documents', {
	id: uuid().notNull().primaryKey().defaultRandom(),
	organizationItem: uuid().notNull().references(() => organizationItems.id),
	period: integer().notNull(),
	number: integer().notNull(),
	type: uuid().notNull().references(() => documentTypes.id),
	authorOrganizationItem: uuid().references(() => organizationItems.id),
	authorPerson: uuid().references(() => persons.id),
	title: varchar({ length: 256 }).notNull(),
})

export const documentsRelations = relations(documents, ({ one }) => ({
	organizationItem: one(organizationItems, {
		fields: [ documents.organizationItem ],
		references: [ organizationItems.id ],
	}),
	type: one(documentTypes, {
		fields: [ documents.type ],
		references: [ documentTypes.id ],
	}),
	authorOrganizationItem: one(organizationItems, {
		fields: [ documents.authorOrganizationItem ],
		references: [ organizationItems.id ],
	}),
	authorPerson: one(persons, {
		fields: [ documents.authorPerson ],
		references: [ persons.id ],
	}),
}))
