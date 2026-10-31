import { relations, sql } from 'drizzle-orm'
import {
	boolean,
	check,
	date,
	foreignKey,
	integer,
	numeric,
	pgEnum,
	pgTable,
	unique,
	uuid,
	varchar,
} from 'drizzle-orm/pg-core'

import { budgetPlanItems, budgets } from './budget'
import { organizationItems } from './organizationItem'
import { persons } from './person'

/**
 * The capacity in which a person travels. Its organization item only decides
 * the letterhead of the documents, its budget pays for the journey unless a
 * special allocation is named.
 */
export const travelRoles = pgTable('travel_roles', {
	id: uuid().notNull().primaryKey().defaultRandom(),
	code: varchar({ length: 16 }).notNull().unique('travel_role_code_unique'),
	name: varchar({ length: 256 }).notNull(),
	organizationItem: uuid().notNull().references(() => organizationItems.id),
	budget: uuid().notNull().references(() => budgets.id),
})

export const travelRolesRelations = relations(travelRoles, ({ one }) => ({
	organizationItem: one(organizationItems, {
		fields: [ travelRoles.organizationItem ],
		references: [ organizationItems.id ],
	}),
	budget: one(budgets, {
		fields: [ travelRoles.budget ],
		references: [ budgets.id ],
	}),
}))

/** A budget set aside for certain journeys, it pays instead of the role. */
export const travelSpecialAllocations = pgTable('travel_special_allocations', {
	id: uuid().notNull().primaryKey().defaultRandom(),
	code: varchar({ length: 16 }).notNull().unique('travel_special_allocation_code_unique'),
	name: varchar({ length: 256 }).notNull(),
	budget: uuid().notNull().references(() => budgets.id),
})

export const travelSpecialAllocationsRelations = relations(travelSpecialAllocations, ({ one }) => ({
	budget: one(budgets, {
		fields: [ travelSpecialAllocations.budget ],
		references: [ budgets.id ],
	}),
}))

export const travelCostTypes = pgTable('travel_cost_types', {
	id: uuid().notNull().primaryKey().defaultRandom(),
	code: varchar({ length: 16 }).notNull().unique('travel_cost_type_code_unique'),
	name: varchar({ length: 256 }).notNull(),
})

export const travelTransportModes = pgTable('travel_transport_modes', {
	id: uuid().notNull().primaryKey().defaultRandom(),
	code: varchar({ length: 16 }).notNull().unique('travel_transport_mode_code_unique'),
	name: varchar({ length: 256 }).notNull(),
	// Whether a journey by this means has to give one of its reasons.
	reasonRequired: boolean().notNull().default(false),
})

export const travelTransportModesRelations = relations(travelTransportModes, ({ many }) => ({
	reasons: many(travelTransportReasons),
}))

export const travelTransportReasons = pgTable('travel_transport_reasons', {
	id: uuid().notNull().primaryKey().defaultRandom(),
	transportMode: uuid().notNull(),
	code: varchar({ length: 16 }).notNull(),
	name: varchar({ length: 256 }).notNull(),
}, (table) => [
	unique('travel_transport_reason_code_unique').on(table.transportMode, table.code),
	// Named by hand, the generated name exceeds the 63 bytes Postgres keeps.
	foreignKey({
		name: 'travel_transport_reason_transport_mode_fk',
		columns: [ table.transportMode ],
		foreignColumns: [ travelTransportModes.id ],
	}),
])

export const travelTransportReasonsRelations = relations(travelTransportReasons, ({ one }) => ({
	transportMode: one(travelTransportModes, {
		fields: [ travelTransportReasons.transportMode ],
		references: [ travelTransportModes.id ],
	}),
}))

export const travelPermitTypes = pgEnum('travel_permit_types', [
	'planned',
	'reserve',
])

/**
 * The permit to travel, granted before the journey on the costs expected. Like
 * an expense authorization it binds the money of a budget plan item or of the
 * reserve.
 */
export const travelPermits = pgTable('travel_permits', {
	id: uuid().notNull().primaryKey().defaultRandom(),
	traveler: uuid().notNull().references(() => persons.id),
	role: uuid().notNull().references(() => travelRoles.id),
	specialAllocation: uuid(),
	title: varchar({ length: 256 }).notNull(),
	description: varchar({ length: 1024 }),
	origin: varchar({ length: 256 }).notNull(),
	destination: varchar({ length: 256 }).notNull(),
	startDate: date().notNull(),
	endDate: date().notNull(),
	transportMode: uuid().notNull().references(() => travelTransportModes.id),
	transportReason: uuid().references(() => travelTransportReasons.id),
	type: travelPermitTypes().notNull().default('planned'),
	budgetPlanItem: uuid().references(() => budgetPlanItems.id),
	budget: uuid().references(() => budgets.id),
	// The sum of the items, kept so that the actuals need not add them up.
	amount: numeric({ precision: 16, scale: 2, mode: 'number' }).notNull(),
}, (table) => [
	// Named by hand, the generated name exceeds the 63 bytes Postgres keeps.
	foreignKey({
		name: 'travel_permit_special_allocation_fk',
		columns: [ table.specialAllocation ],
		foreignColumns: [ travelSpecialAllocations.id ],
	}),
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
		'valid_date_range',
		sql`${table.endDate} >= ${table.startDate}`,
	),
	check(
		'amount_positive',
		sql`${table.amount} > 0`,
	),
])

export const travelPermitsRelations = relations(travelPermits, ({ one, many }) => ({
	traveler: one(persons, {
		fields: [ travelPermits.traveler ],
		references: [ persons.id ],
	}),
	role: one(travelRoles, {
		fields: [ travelPermits.role ],
		references: [ travelRoles.id ],
	}),
	specialAllocation: one(travelSpecialAllocations, {
		fields: [ travelPermits.specialAllocation ],
		references: [ travelSpecialAllocations.id ],
	}),
	transportMode: one(travelTransportModes, {
		fields: [ travelPermits.transportMode ],
		references: [ travelTransportModes.id ],
	}),
	transportReason: one(travelTransportReasons, {
		fields: [ travelPermits.transportReason ],
		references: [ travelTransportReasons.id ],
	}),
	budgetPlanItem: one(budgetPlanItems, {
		fields: [ travelPermits.budgetPlanItem ],
		references: [ budgetPlanItems.id ],
	}),
	budget: one(budgets, {
		fields: [ travelPermits.budget ],
		references: [ budgets.id ],
	}),
	items: many(travelPermitItems),
	advance: one(travelAdvances),
	claim: one(travelClaims),
}))

/** A line of the expected costs, its amount is the most that is reimbursed. */
export const travelPermitItems = pgTable('travel_permit_items', {
	id: uuid().notNull().primaryKey().defaultRandom(),
	permit: uuid().notNull().references(() => travelPermits.id, { onDelete: 'cascade' }),
	ord: integer().notNull(),
	costType: uuid().notNull().references(() => travelCostTypes.id),
	description: varchar({ length: 1024 }),
	amount: numeric({ precision: 16, scale: 2, mode: 'number' }).notNull(),
}, (table) => [
	unique('travel_permit_item_ord_unique').on(table.permit, table.ord),
	check(
		'valid_ord',
		sql`${table.ord} >= 0`,
	),
	check(
		'amount_positive',
		sql`${table.amount} > 0`,
	),
])

export const travelPermitItemsRelations = relations(travelPermitItems, ({ one, many }) => ({
	permit: one(travelPermits, {
		fields: [ travelPermitItems.permit ],
		references: [ travelPermits.id ],
	}),
	costType: one(travelCostTypes, {
		fields: [ travelPermitItems.costType ],
		references: [ travelCostTypes.id ],
	}),
	claimItems: many(travelClaimItems),
}))

/** The advance paid to the traveller before the journey, at most one. */
export const travelAdvances = pgTable('travel_advances', {
	id: uuid().notNull().primaryKey().defaultRandom(),
	permit: uuid().notNull().unique('travel_advance_permit_unique').references(() => travelPermits.id),
	amount: numeric({ precision: 16, scale: 2, mode: 'number' }).notNull(),
}, (table) => [
	check(
		'amount_positive',
		sql`${table.amount} > 0`,
	),
])

export const travelAdvancesRelations = relations(travelAdvances, ({ one }) => ({
	permit: one(travelPermits, {
		fields: [ travelAdvances.permit ],
		references: [ travelPermits.id ],
	}),
}))

/**
 * The claim for the costs that actually arose, at most one per permit. Each
 * line of the permit is reimbursed up to its amount.
 */
export const travelClaims = pgTable('travel_claims', {
	id: uuid().notNull().primaryKey().defaultRandom(),
	permit: uuid().notNull().unique('travel_claim_permit_unique').references(() => travelPermits.id),
	// The costs as claimed, before they are capped to the permit.
	requestedAmount: numeric({ precision: 16, scale: 2, mode: 'number' }).notNull(),
	// The costs that are reimbursed.
	amount: numeric({ precision: 16, scale: 2, mode: 'number' }).notNull(),
	// What is left to pay out once the advance is set off. Negative if the
	// advance exceeds the costs and the rest has to be paid back.
	payoutAmount: numeric({ precision: 16, scale: 2, mode: 'number' }).notNull(),
}, (table) => [
	check(
		'valid_amount',
		sql`${table.amount} >= 0 AND ${table.amount} <= ${table.requestedAmount}`,
	),
])

export const travelClaimsRelations = relations(travelClaims, ({ one, many }) => ({
	permit: one(travelPermits, {
		fields: [ travelClaims.permit ],
		references: [ travelPermits.id ],
	}),
	items: many(travelClaimItems),
}))

/** A cost that actually arose, booked on a line of the permit. */
export const travelClaimItems = pgTable('travel_claim_items', {
	id: uuid().notNull().primaryKey().defaultRandom(),
	claim: uuid().notNull().references(() => travelClaims.id, { onDelete: 'cascade' }),
	ord: integer().notNull(),
	permitItem: uuid().notNull().references(() => travelPermitItems.id),
	description: varchar({ length: 256 }),
	amount: numeric({ precision: 16, scale: 2, mode: 'number' }).notNull(),
}, (table) => [
	unique('travel_claim_item_ord_unique').on(table.claim, table.ord),
	check(
		'valid_ord',
		sql`${table.ord} >= 0`,
	),
	check(
		'amount_positive',
		sql`${table.amount} > 0`,
	),
])

export const travelClaimItemsRelations = relations(travelClaimItems, ({ one }) => ({
	claim: one(travelClaims, {
		fields: [ travelClaimItems.claim ],
		references: [ travelClaims.id ],
	}),
	permitItem: one(travelPermitItems, {
		fields: [ travelClaimItems.permitItem ],
		references: [ travelPermitItems.id ],
	}),
}))
