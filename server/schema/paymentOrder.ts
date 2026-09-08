import { relations, sql } from 'drizzle-orm'
import {
	check,
	numeric,
	pgEnum,
	pgTable,
	uuid,
	varchar,
} from 'drizzle-orm/pg-core'

import { budgetPlanItems, budgets } from './budget'
import { expenseAuthorizations } from './expenseAuthorization'
import { persons } from './person'

export const paymentOrderTypes = pgEnum('payment_order_types', [
	'planned',
	'reserve',
])

export const paymentOrderRecipientTypes = pgEnum('payment_order_recipient_types', [
	'reimbursement',
	'invoice',
])

export const paymentOrders = pgTable('payment_orders', {
	id: uuid().notNull().primaryKey().defaultRandom(),
	type: paymentOrderTypes().notNull().default('planned'),
	budgetPlanItem: uuid().references(() => budgetPlanItems.id),
	budget: uuid().references(() => budgets.id),
	// The expense authorization the payment is made on. Optional, because not
	// every payment needs one of its own.
	expenseAuthorization: uuid().references(() => expenseAuthorizations.id),
	recipientType: paymentOrderRecipientTypes().notNull().default('reimbursement'),
	recipientPerson: uuid().references(() => persons.id),
	recipientName: varchar({ length: 256 }),
	// Only kept for an invoice. The bank details of a member are stored with the
	// person, so that they are maintained in a single place.
	recipientIban: varchar({ length: 34 }),
	purpose: varchar({ length: 256 }),
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
	check(
		'valid_recipient_type',
		sql`(
			${table.recipientType} = 'reimbursement' AND
			${table.recipientPerson} IS NOT NULL AND
			${table.recipientName} IS NULL AND
			${table.recipientIban} IS NULL AND
			${table.purpose} IS NULL
		) OR (
			${table.recipientType} = 'invoice' AND
			${table.recipientPerson} IS NULL AND
			${table.recipientName} IS NOT NULL AND
			${table.recipientIban} IS NOT NULL AND
			${table.purpose} IS NOT NULL
		)`,
	),
	check(
		'amount_positive',
		sql`${table.amount} > 0`,
	),
])

export const paymentOrdersRelations = relations(paymentOrders, ({ one }) => ({
	budget: one(budgets, {
		fields: [ paymentOrders.budget ],
		references: [ budgets.id ],
	}),
	budgetPlanItem: one(budgetPlanItems, {
		fields: [ paymentOrders.budgetPlanItem ],
		references: [ budgetPlanItems.id ],
	}),
	expenseAuthorization: one(expenseAuthorizations, {
		fields: [ paymentOrders.expenseAuthorization ],
		references: [ expenseAuthorizations.id ],
	}),
	recipientPerson: one(persons, {
		fields: [ paymentOrders.recipientPerson ],
		references: [ persons.id ],
	}),
}))
