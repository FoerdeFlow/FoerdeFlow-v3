import {
	relations,
} from 'drizzle-orm'
import {
	pgTable,
	text,
	uuid,
	varchar,
	type AnyPgColumn,
} from 'drizzle-orm/pg-core'

export const organizationTypes = pgTable('organization_types', {
	id: uuid().notNull().primaryKey().defaultRandom(),
	code: varchar({ length: 32 }).notNull().unique(),
	name: varchar({ length: 256 }).notNull().unique(),
})

export const organizationItems = pgTable('organization_items', {
	id: uuid().notNull().primaryKey().defaultRandom(),
	organizationType: uuid().notNull().references(() => organizationTypes.id),
	parent: uuid().references((): AnyPgColumn => organizationItems.id),
	code: varchar({ length: 32 }).notNull().unique(),
	name: varchar({ length: 256 }).notNull().unique(),
	description: text().notNull(),
})

export const organizationItemsRelations = relations(organizationItems, ({ one, many }) => ({
	parent: one(organizationItems, {
		fields: [ organizationItems.parent ],
		references: [ organizationItems.id ],
		relationName: 'parent',
	}),
	children: many(organizationItems, {
		relationName: 'parent',
	}),
	organizationType: one(organizationTypes, {
		fields: [ organizationItems.organizationType ],
		references: [ organizationTypes.id ],
	}),
	members: many(memberships, {
		relationName: 'organizationItem',
	}),
}))
