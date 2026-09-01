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

import { organizationItems } from './organizationItem'
import { persons } from './person'

export const representationAllowancePeriodUnits = pgEnum('representation_allowance_period_units', [
	'month',
	'once',
])

export const representationAllowances = pgTable('representation_allowances', {
	id: uuid().notNull().primaryKey().defaultRandom(),
	organizationItem: uuid().notNull().references(() => organizationItems.id),
	title: varchar({ length: 256 }).notNull(),
	description: varchar({ length: 1024 }),
	periodUnit: representationAllowancePeriodUnits().notNull().default('month'),
	startDate: date().notNull(),
	endDate: date(),
}, (table) => [
	check(
		'valid_date_range',
		sql`${table.endDate} IS NULL OR ${table.endDate} > ${table.startDate}`,
	),
	check(
		'valid_period_unit',
		sql`${table.periodUnit} <> 'once' OR ${table.endDate} IS NULL`,
	),
])

export const representationAllowancesRelations = relations(representationAllowances, ({ one, many }) => ({
	organizationItem: one(organizationItems, {
		fields: [ representationAllowances.organizationItem ],
		references: [ organizationItems.id ],
	}),
	recipients: many(representationAllowanceRecipients),
}))

export const representationAllowanceRecipients = pgTable('representation_allowance_recipients', {
	id: uuid().notNull().primaryKey().defaultRandom(),
	representationAllowance: uuid()
		.notNull()
		.references(() => representationAllowances.id, { onDelete: 'cascade' }),
	ord: integer(),
	person: uuid().notNull().references(() => persons.id),
	amount: numeric({ precision: 16, scale: 2, mode: 'number' }).notNull(),
}, (table) => [
	unique('representation_allowance_ord_unique')
		.on(table.representationAllowance, table.ord),
	unique('representation_allowance_person_unique')
		.on(table.representationAllowance, table.person),
	check(
		'valid_ord',
		sql`${table.ord} >= 0`,
	),
	check(
		'amount_positive',
		sql`${table.amount} > 0`,
	),
])

export const representationAllowanceRecipientsRelations = relations(
	representationAllowanceRecipients,
	({ one }) => ({
		representationAllowance: one(representationAllowances, {
			fields: [ representationAllowanceRecipients.representationAllowance ],
			references: [ representationAllowances.id ],
		}),
		person: one(persons, {
			fields: [ representationAllowanceRecipients.person ],
			references: [ persons.id ],
		}),
	}),
)
