import { relations, sql } from 'drizzle-orm'
import {
	boolean,
	check,
	date,
	foreignKey,
	numeric,
	pgEnum,
	pgTable,
	timestamp,
	unique,
	uuid,
	varchar,
} from 'drizzle-orm/pg-core'

import { budgetPlanItems, budgets } from './budget'
import { organizationItems } from './organizationItem'
import { paymentOrders } from './paymentOrder'
import { persons } from './person'

export const bankAccounts = pgTable('bank_accounts', {
	id: uuid().notNull().primaryKey().defaultRandom(),
	organizationItem: uuid().notNull().references(() => organizationItems.id),
	name: varchar({ length: 256 }).notNull(),
	// Stored without spaces, so that the account of an uploaded statement can be
	// found by comparing it with the IBAN given there.
	iban: varchar({ length: 34 }).notNull(),
}, (table) => [
	unique('bank_account_iban_unique')
		.on(table.iban),
])

export const bankAccountsRelations = relations(bankAccounts, ({ one, many }) => ({
	organizationItem: one(organizationItems, {
		fields: [ bankAccounts.organizationItem ],
		references: [ organizationItems.id ],
	}),
	statements: many(bankStatements),
	transactions: many(bankTransactions),
}))

// A single statement (`Stmt`) of an uploaded camt.053 file.
export const bankStatements = pgTable('bank_statements', {
	id: uuid().notNull().primaryKey().defaultRandom(),
	bankAccount: uuid().notNull().references(() => bankAccounts.id),
	statementId: varchar({ length: 35 }).notNull(),
	sequenceNumber: varchar({ length: 18 }),
	createdAt: timestamp().notNull(),
	fromDate: date(),
	toDate: date(),
	// Signed: a negative balance is a debit balance.
	openingBalance: numeric({ precision: 16, scale: 2, mode: 'number' }),
	closingBalance: numeric({ precision: 16, scale: 2, mode: 'number' }),
	uploadedAt: timestamp().notNull().defaultNow(),
	// Empty if the statement was uploaded with the API key.
	uploadedBy: uuid().references(() => persons.id),
}, (table) => [
	unique('bank_statement_unique')
		.on(table.bankAccount, table.statementId),
])

export const bankStatementsRelations = relations(bankStatements, ({ one, many }) => ({
	bankAccount: one(bankAccounts, {
		fields: [ bankStatements.bankAccount ],
		references: [ bankAccounts.id ],
	}),
	uploadedBy: one(persons, {
		fields: [ bankStatements.uploadedBy ],
		references: [ persons.id ],
	}),
	transactions: many(bankTransactions),
}))

export const bankTransactionDirections = pgEnum('bank_transaction_directions', [
	'credit',
	'debit',
])

export const bankTransactions = pgTable('bank_transactions', {
	id: uuid().notNull().primaryKey().defaultRandom(),
	bankAccount: uuid().notNull().references(() => bankAccounts.id),
	// The statement the transaction was first imported with. Overlapping
	// statements do not import it again.
	statement: uuid().notNull().references(() => bankStatements.id),
	// Identifies the transaction within the account across statements, see
	// `parseCamt053`.
	importKey: varchar({ length: 128 }).notNull(),
	bookingDate: date().notNull(),
	valueDate: date(),
	direction: bankTransactionDirections().notNull(),
	amount: numeric({ precision: 16, scale: 2, mode: 'number' }).notNull(),
	reversal: boolean().notNull().default(false),
	counterpartyName: varchar({ length: 140 }),
	counterpartyIban: varchar({ length: 34 }),
	purpose: varchar({ length: 1024 }),
	endToEndId: varchar({ length: 35 }),
	accountServicerReference: varchar({ length: 35 }),
	additionalInfo: varchar({ length: 500 }),
}, (table) => [
	unique('bank_transaction_import_key_unique')
		.on(table.bankAccount, table.importKey),
	check(
		'amount_positive',
		sql`${table.amount} > 0`,
	),
])

export const bankTransactionsRelations = relations(bankTransactions, ({ one, many }) => ({
	bankAccount: one(bankAccounts, {
		fields: [ bankTransactions.bankAccount ],
		references: [ bankAccounts.id ],
	}),
	statement: one(bankStatements, {
		fields: [ bankTransactions.statement ],
		references: [ bankStatements.id ],
	}),
	assignments: many(bankTransactionAssignments),
}))

export const bankTransactionAssignmentTypes = pgEnum('bank_transaction_assignment_types', [
	'planned',
	'reserve',
	// Money moved between accounts of the student body, such as the remainder
	// of a budget put on the reserve account and paid back from there. It is
	// neither revenue nor expense of a budget.
	'transfer',
])

// A part of a transaction booked on a budget plan item, on the reserve of a
// budget or marked as a transfer between own accounts. The parts of a
// transaction never exceed its amount.
export const bankTransactionAssignments = pgTable('bank_transaction_assignments', {
	id: uuid().notNull().primaryKey().defaultRandom(),
	transaction: uuid().notNull(),
	type: bankTransactionAssignmentTypes().notNull().default('planned'),
	budgetPlanItem: uuid(),
	budget: uuid().references(() => budgets.id),
	// The payment order the transaction carries out, if any.
	paymentOrder: uuid().references(() => paymentOrders.id),
	amount: numeric({ precision: 16, scale: 2, mode: 'number' }).notNull(),
	note: varchar({ length: 256 }),
}, (table) => [
	// Named by hand, the generated names exceed the 63 bytes Postgres keeps.
	foreignKey({
		name: 'bank_transaction_assignment_transaction_fk',
		columns: [ table.transaction ],
		foreignColumns: [ bankTransactions.id ],
	}).onDelete('cascade'),
	foreignKey({
		name: 'bank_transaction_assignment_budget_plan_item_fk',
		columns: [ table.budgetPlanItem ],
		foreignColumns: [ budgetPlanItems.id ],
	}),
	// The transfer is compared as text: the migration adding the value runs in
	// one transaction, and within it Postgres refuses to use a new enum value.
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
		) OR (
			${table.type}::text = 'transfer' AND
			${table.budget} IS NULL AND
			${table.budgetPlanItem} IS NULL AND
			${table.paymentOrder} IS NULL
		)`,
	),
	check(
		'amount_positive',
		sql`${table.amount} > 0`,
	),
])

export const bankTransactionAssignmentsRelations = relations(bankTransactionAssignments, ({ one }) => ({
	transaction: one(bankTransactions, {
		fields: [ bankTransactionAssignments.transaction ],
		references: [ bankTransactions.id ],
	}),
	budgetPlanItem: one(budgetPlanItems, {
		fields: [ bankTransactionAssignments.budgetPlanItem ],
		references: [ budgetPlanItems.id ],
	}),
	budget: one(budgets, {
		fields: [ bankTransactionAssignments.budget ],
		references: [ budgets.id ],
	}),
	paymentOrder: one(paymentOrders, {
		fields: [ bankTransactionAssignments.paymentOrder ],
		references: [ paymentOrders.id ],
	}),
}))
