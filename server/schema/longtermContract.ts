import { relations, sql } from 'drizzle-orm'
import {
	check,
	date,
	integer,
	numeric,
	pgEnum,
	pgTable,
	unique,
	uuid,
	varchar,
} from 'drizzle-orm/pg-core'

import { budgets } from './budget'

export const longtermContracts = pgTable('longterm_contracts', {
	id: uuid().notNull().primaryKey().defaultRandom(),
	budget: uuid().notNull().references(() => budgets.id),
	title: varchar({ length: 256 }).notNull(),
	description: varchar({ length: 1024 }),
	startDate: date().notNull(),
	endDate: date(),
}, (table) => [
	check(
		'valid_date_range',
		sql`${table.endDate} IS NULL OR ${table.endDate} > ${table.startDate}`,
	),
])

export const longtermContractsRelations = relations(longtermContracts, ({ one, many }) => ({
	budget: one(budgets, {
		fields: [ longtermContracts.budget ],
		references: [ budgets.id ],
	}),
	items: many(longtermContractItems),
}))

export const longtermContractItemTypes = pgEnum('longterm_contract_item_types', [
	'time',
	'usage',
	'fixed',
])

export const longtermContractTimeUnits = pgEnum('longterm_contract_time_units', [
	'month',
	'quarter',
	'semester',
	'year',
])

export const longtermContractItems = pgTable('longterm_contract_items', {
	id: uuid().notNull().primaryKey().defaultRandom(),
	longtermContract: uuid().notNull().references(() => longtermContracts.id, { onDelete: 'cascade' }),
	ord: integer(),
	type: longtermContractItemTypes().notNull().default('time'),
	title: varchar({ length: 256 }).notNull(),
	description: varchar({ length: 1024 }),
	amount: numeric({ precision: 16, scale: 2, mode: 'number' }).notNull(),
	timeUnit: longtermContractTimeUnits(),
	usageUnit: varchar({ length: 64 }),
	expectedUsage: numeric({ precision: 16, scale: 2, mode: 'number' }),
}, (table) => [
	unique('longterm_contract_ord_unique')
		.on(table.longtermContract, table.ord),
	check(
		'valid_ord',
		sql`${table.ord} >= 0`,
	),
	check(
		'amount_positive',
		sql`${table.amount} > 0`,
	),
	check(
		'expected_usage_positive',
		sql`${table.expectedUsage} > 0`,
	),
	check(
		'valid_type',
		sql`(
			${table.type} = 'time' AND
			${table.timeUnit} IS NOT NULL AND
			${table.usageUnit} IS NULL AND
			${table.expectedUsage} IS NULL
		) OR (
			${table.type} = 'usage' AND
			${table.usageUnit} IS NOT NULL AND
			${table.expectedUsage} IS NOT NULL AND
			${table.timeUnit} IS NOT NULL
		) OR (
			${table.type} = 'fixed' AND
			${table.timeUnit} IS NULL AND
			${table.usageUnit} IS NULL AND
			${table.expectedUsage} IS NULL
		)`,
	),
])

export const longtermContractItemsRelations = relations(longtermContractItems, ({ one }) => ({
	longtermContract: one(longtermContracts, {
		fields: [ longtermContractItems.longtermContract ],
		references: [ longtermContracts.id ],
	}),
}))
