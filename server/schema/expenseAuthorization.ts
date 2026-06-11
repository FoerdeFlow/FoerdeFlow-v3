import { relations, sql } from 'drizzle-orm'
import {
	check,
	integer,
	numeric,
	pgEnum,
	pgTable,
	unique,
	uuid,
	varchar,
} from 'drizzle-orm/pg-core'

import { budgets, budgetPlanItems } from './budget'

export const expenseAuthorizationTypes = pgEnum('expense_authorization_types', [
	'planned',
	'reserve',
])

export const expenseAuthorizations = pgTable('expense_authorizations', {
	id: uuid().notNull().primaryKey().defaultRandom(),
	type: expenseAuthorizationTypes().notNull().default('planned'),
	budgetPlanItem: uuid().references(() => budgetPlanItems.id),
	budget: uuid().references(() => budgets.id),
	title: varchar({ length: 256 }).notNull(),
	description: varchar({ length: 1024 }),
	amount: numeric({ precision: 16, scale: 2, mode: 'number' }).notNull(),
}, (table) => [
	check(
		'valid_type',
		sql`(
			${table.type} = 'planned' AND
			${table.budgetPlanItem} IS NOT NULL AND
			${table.budget} IS NULL
		) OR (
			${table.type} = 'reserve' AND
			${table.budget} IS NOT NULL AND
			${table.budgetPlanItem} IS NULL
		)`,
	),
])

export const expenseAuthorizationsRelations = relations(expenseAuthorizations, ({ one, many }) => ({
	budget: one(budgets, {
		fields: [expenseAuthorizations.budget],
		references: [budgets.id],
	}),
	budgetPlanItem: one(budgetPlanItems, {
		fields: [expenseAuthorizations.budgetPlanItem],
		references: [budgetPlanItems.id],
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
		fields: [expenseAuthorizationItems.expenseAuthorization],
		references: [expenseAuthorizations.id],
	}),
}))
