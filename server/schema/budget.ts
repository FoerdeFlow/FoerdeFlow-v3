import { relations, sql } from 'drizzle-orm'
import {
	check,
	date,
	numeric,
	pgTable,
	uuid,
	varchar,
} from 'drizzle-orm/pg-core'

import { organizationItems } from './organizationItem'

export const budgets = pgTable('budgets', {
	id: uuid().notNull().primaryKey().defaultRandom(),
	organizationItem: uuid().notNull().references(() => organizationItems.id),
	code: varchar({ length: 16 }).notNull(),
	name: varchar({ length: 256 }).notNull(),
})

export const budgetsRelations = relations(budgets, ({ one, many }) => ({
	organizationItem: one(organizationItems, {
		fields: [ budgets.organizationItem ],
		references: [ organizationItems.id ],
	}),
	plans: many(budgetPlans),
}))

export const budgetPlans = pgTable('budget_plans', {
	id: uuid().notNull().primaryKey().defaultRandom(),
	budget: uuid().notNull().references(() => budgets.id),
	startDate: date().notNull(),
	endDate: date().notNull(),
}, (table) => [
	check(
		'valid_date_range',
		sql`${table.endDate} > ${table.startDate}`,
	),
])

export const budgetPlansRelations = relations(budgetPlans, ({ many, one }) => ({
	budget: one(budgets, {
		fields: [ budgetPlans.budget ],
		references: [ budgets.id ],
	}),
	items: many(budgetPlanItems),
}))

export const budgetPlanItems = pgTable('budget_plan_items', {
	id: uuid().notNull().primaryKey().defaultRandom(),
	plan: uuid().notNull().references(() => budgetPlans.id, { onDelete: 'cascade' }),
	title: varchar({ length: 256 }).notNull(),
	description: varchar({ length: 1024 }).notNull(),
	revenues: numeric({ precision: 16, scale: 2, mode: 'number' }).notNull(),
	expenses: numeric({ precision: 16, scale: 2, mode: 'number' }).notNull(),
}, (table) => [
	check(
		'revenues_non_negative',
		sql`${table.revenues} >= 0`,
	),
	check(
		'expenses_non_negative',
		sql`${table.expenses} >= 0`,
	),
	check(
		'revenues_or_expenses_positive',
		sql`${table.revenues} > 0 OR ${table.expenses} > 0`,
	),
])

export const budgetPlanItemsRelations = relations(budgetPlanItems, ({ one }) => ({
	plan: one(budgetPlans, {
		fields: [ budgetPlanItems.plan ],
		references: [ budgetPlans.id ],
	}),
}))
