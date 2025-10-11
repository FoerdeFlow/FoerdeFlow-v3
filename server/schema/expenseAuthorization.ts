import { relations, sql } from 'drizzle-orm'
import {
	check,
	integer,
	numeric,
	pgTable,
	unique,
	uuid,
	varchar,
} from 'drizzle-orm/pg-core'

import { budgetPlanItems } from './budget'

export const expenseAuthorizations = pgTable('expense_authorizations', {
	id: uuid().notNull().primaryKey().defaultRandom(),
	budgetPlanItem: uuid().notNull().references(() => budgetPlanItems.id),
	title: varchar({ length: 256 }).notNull(),
	description: varchar({ length: 1024 }),
	amount: numeric({ precision: 16, scale: 2, mode: 'number' }).notNull(),
})

export const expenseAuthorizationsRelations = relations(expenseAuthorizations, ({ one, many }) => ({
	budgetPlanItem: one(budgetPlanItems, {
		fields: [ expenseAuthorizations.budgetPlanItem ],
		references: [ budgetPlanItems.id ],
	}),
	items: many(expenseAuthorizationItems),
}))

export const expenseAuthorizationItems = pgTable('expense_authorization_items', {
	id: uuid().notNull().primaryKey().defaultRandom(),
	expenseAuthorization: uuid().notNull().references(() => expenseAuthorizations.id, { onDelete: 'cascade' }),
	ord: integer(),
	title: varchar({ length: 256 }).notNull(),
	description: varchar({ length: 1024 }),
	amount: numeric({ precision: 16, scale: 2, mode: 'number' }).notNull(),
}, (table) => [
	unique('expense_authorization_ord_unique')
		.on(table.expenseAuthorization, table.ord),
	check(
		'valid_ord',
		sql`${table.ord} >= 0`,
	),
])

export const expenseAuthorizationItemsRelations = relations(expenseAuthorizationItems, ({ one }) => ({
	expenseAuthorization: one(expenseAuthorizations, {
		fields: [ expenseAuthorizationItems.expenseAuthorization ],
		references: [ expenseAuthorizations.id ],
	}),
}))
