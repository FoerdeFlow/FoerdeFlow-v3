import { relations, sql } from 'drizzle-orm'
import {
	boolean,
	check,
	date,
	integer,
	numeric,
	pgEnum,
	pgTable,
	timestamp,
	unique,
	uuid,
	varchar,
} from 'drizzle-orm/pg-core'

import { budgetPlanItems, budgets } from './budget'
import { persons } from './person'

/**
 * A permit is either given for a single journey or, up to a small amount per
 * journey, for every journey of a period (§ 3 Absatz 6 DiReiseR).
 */
export const travelPermitKinds = pgEnum('travel_permit_kinds', [
	'single',
	'general',
])

export const travelPermitTypes = pgEnum('travel_permit_types', [
	'planned',
	'reserve',
])

/** Whether a journey leads to a session of the parliament (§ 3 Absatz 3). */
export const travelPermitOccasions = pgEnum('travel_permit_occasions', [
	'parliamentSession',
	'other',
])

/** On which ground the travellers fall under the regulation (§ 1). */
export const travelPermitTravelerBases = pgEnum('travel_permit_traveler_bases', [
	'officeHolder',
	'employee',
	'commissioned',
	'sports',
	'recognizedMember',
])

/**
 * Whether a special interest of the student body was established for the
 * journey (§ 2 Absatz 2), and on which ground.
 */
export const travelPermitSpecialInterests = pgEnum('travel_permit_special_interests', [
	'none',
	'campusTravel',
	'centralBodySession',
	'vehicleCosts',
	'parliamentDecision',
])

export const travelPermitCars = pgEnum('travel_permit_cars', [
	'none',
	'private',
	'carsharing',
])

export const travelPermits = pgTable('travel_permits', {
	id: uuid().notNull().primaryKey().defaultRandom(),
	kind: travelPermitKinds().notNull().default('single'),
	type: travelPermitTypes().notNull().default('planned'),
	budgetPlanItem: uuid().references(() => budgetPlanItems.id),
	budget: uuid().references(() => budgets.id),
	title: varchar({ length: 256 }).notNull(),
	description: varchar({ length: 1024 }),
	destination: varchar({ length: 256 }).notNull(),
	domestic: boolean().notNull().default(true),
	// The journey itself, or the period a general permit is valid for.
	startDate: date().notNull(),
	endDate: date().notNull(),
	occasion: travelPermitOccasions().notNull().default('other'),
	travelerBasis: travelPermitTravelerBases().notNull(),
	specialInterest: travelPermitSpecialInterests().notNull().default('none'),
	specialInterestReference: varchar({ length: 256 }),
	longDistance: boolean().notNull().default(false),
	car: travelPermitCars().notNull().default('none'),
	carInterestReason: varchar({ length: 1024 }),
	parkingFeesAllowed: boolean().notNull().default(false),
	// Car sharing is invoiced to the student body as a whole, so the estimate
	// only counts towards the limits and is never reimbursed.
	carsharingEstimate: numeric({ precision: 16, scale: 2, mode: 'number' }),
	advanceAmount: numeric({ precision: 16, scale: 2, mode: 'number' }),
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
		'valid_date_range',
		sql`${table.endDate} >= ${table.startDate}`,
	),
	check(
		'valid_special_interest',
		sql`${table.specialInterest} <> 'parliamentDecision' OR ${table.specialInterestReference} IS NOT NULL`,
	),
	check(
		'valid_car',
		sql`(${table.car} = 'none') = (${table.carInterestReason} IS NULL)`,
	),
	check(
		'valid_carsharing_estimate',
		sql`${table.carsharingEstimate} IS NULL OR (
			${table.car} = 'carsharing' AND ${table.carsharingEstimate} >= 0
		)`,
	),
	check(
		'valid_parking_fees',
		sql`${table.car} <> 'none' OR NOT ${table.parkingFeesAllowed}`,
	),
	check(
		'valid_advance',
		sql`${table.advanceAmount} IS NULL OR (
			${table.kind} = 'single' AND ${table.advanceAmount} > 0
		)`,
	),
])

export const travelPermitsRelations = relations(travelPermits, ({ one, many }) => ({
	budget: one(budgets, {
		fields: [ travelPermits.budget ],
		references: [ budgets.id ],
	}),
	budgetPlanItem: one(budgetPlanItems, {
		fields: [ travelPermits.budgetPlanItem ],
		references: [ budgetPlanItems.id ],
	}),
	travelers: many(travelPermitTravelers),
	claims: many(travelClaims),
}))

export const travelPermitTravelers = pgTable('travel_permit_travelers', {
	id: uuid().notNull().primaryKey().defaultRandom(),
	permit: uuid()
		.notNull()
		.references(() => travelPermits.id, { onDelete: 'cascade' }),
	ord: integer().notNull(),
	person: uuid().notNull().references(() => persons.id),
	// The costs approved for this person. For a general permit they are the
	// costs of a single journey.
	amount: numeric({ precision: 16, scale: 2, mode: 'number' }).notNull(),
	driver: boolean().notNull().default(false),
}, (table) => [
	unique('travel_permit_ord_unique').on(table.permit, table.ord),
	unique('travel_permit_person_unique').on(table.permit, table.person),
	check(
		'valid_ord',
		sql`${table.ord} >= 0`,
	),
	check(
		'amount_not_negative',
		sql`${table.amount} >= 0`,
	),
])

export const travelPermitTravelersRelations = relations(travelPermitTravelers, ({ one }) => ({
	permit: one(travelPermits, {
		fields: [ travelPermitTravelers.permit ],
		references: [ travelPermits.id ],
	}),
	person: one(persons, {
		fields: [ travelPermitTravelers.person ],
		references: [ persons.id ],
	}),
}))

export const travelClaims = pgTable('travel_claims', {
	id: uuid().notNull().primaryKey().defaultRandom(),
	permit: uuid().notNull().references(() => travelPermits.id),
	recipientPerson: uuid().notNull().references(() => persons.id),
	// Only given for a journey under a general permit, a single permit already
	// names its journey.
	title: varchar({ length: 256 }),
	destination: varchar({ length: 256 }),
	startDate: date().notNull(),
	endDate: date().notNull(),
	amount: numeric({ precision: 16, scale: 2, mode: 'number' }).notNull(),
	advanceAmount: numeric({ precision: 16, scale: 2, mode: 'number' }),
	// What is left to pay out once the advance is set off. Negative if the
	// advance exceeds the costs and has to be paid back in part.
	payoutAmount: numeric({ precision: 16, scale: 2, mode: 'number' }).notNull(),
	// Whether the claim was handed in after the period of § 4.
	late: boolean().notNull().default(false),
	createdAt: timestamp().notNull().defaultNow(),
}, (table) => [
	check(
		'valid_date_range',
		sql`${table.endDate} >= ${table.startDate}`,
	),
	check(
		'amount_not_negative',
		sql`${table.amount} >= 0`,
	),
])

export const travelClaimsRelations = relations(travelClaims, ({ one, many }) => ({
	permit: one(travelPermits, {
		fields: [ travelClaims.permit ],
		references: [ travelPermits.id ],
	}),
	recipientPerson: one(persons, {
		fields: [ travelClaims.recipientPerson ],
		references: [ persons.id ],
	}),
	items: many(travelClaimItems),
}))

export const travelClaimItemCategories = pgEnum('travel_claim_item_categories', [
	'publicTransport',
	'longDistance',
	'seatReservation',
	'privateCar',
	'parking',
	'vehicleExpenses',
	'conferenceFee',
	'training',
])

export const travelClaimItems = pgTable('travel_claim_items', {
	id: uuid().notNull().primaryKey().defaultRandom(),
	claim: uuid()
		.notNull()
		.references(() => travelClaims.id, { onDelete: 'cascade' }),
	ord: integer().notNull(),
	traveler: uuid().notNull().references(() => persons.id),
	category: travelClaimItemCategories().notNull(),
	description: varchar({ length: 256 }).notNull(),
	amount: numeric({ precision: 16, scale: 2, mode: 'number' }).notNull(),
	// Only for the use of a private car, whose amount follows from it.
	kilometers: integer(),
	// The event a fee belongs to, the limit of § 8 applies per event.
	event: varchar({ length: 256 }),
	// How many receipts were handed in, they are stored as attachments of the
	// process the claim was made in.
	receipts: integer().notNull().default(0),
}, (table) => [
	unique('travel_claim_ord_unique').on(table.claim, table.ord),
	check(
		'valid_ord',
		sql`${table.ord} >= 0`,
	),
	check(
		'amount_positive',
		sql`${table.amount} > 0`,
	),
	check(
		'valid_kilometers',
		sql`(${table.category} = 'privateCar') = (${table.kilometers} IS NOT NULL)`,
	),
	check(
		'valid_event',
		sql`${table.category} IN ('conferenceFee', 'training') OR ${table.event} IS NULL`,
	),
])

export const travelClaimItemsRelations = relations(travelClaimItems, ({ one }) => ({
	claim: one(travelClaims, {
		fields: [ travelClaimItems.claim ],
		references: [ travelClaims.id ],
	}),
	traveler: one(persons, {
		fields: [ travelClaimItems.traveler ],
		references: [ persons.id ],
	}),
}))

/**
 * The proof that a person may drive the cars of the student body (§ 7 Absatz
 * 2): their driving licence was checked and they were instructed. Only the
 * dates are kept, never a copy of the licence.
 */
export const vehicleDriverQualifications = pgTable('vehicle_driver_qualifications', {
	id: uuid().notNull().primaryKey().defaultRandom(),
	person: uuid().notNull().unique('vehicle_driver_person_unique').references(() => persons.id),
	licenseClass: varchar({ length: 16 }).notNull(),
	licenseCheckedAt: date().notNull(),
	licenseCheckedBy: uuid().notNull().references(() => persons.id),
	instructedAt: date(),
	instructedBy: uuid().references(() => persons.id),
}, (table) => [
	check(
		'valid_instruction',
		sql`(${table.instructedAt} IS NULL) = (${table.instructedBy} IS NULL)`,
	),
])

export const vehicleDriverQualificationsRelations = relations(vehicleDriverQualifications, ({ one }) => ({
	person: one(persons, {
		fields: [ vehicleDriverQualifications.person ],
		references: [ persons.id ],
		relationName: 'vehicleDriverPerson',
	}),
	licenseCheckedBy: one(persons, {
		fields: [ vehicleDriverQualifications.licenseCheckedBy ],
		references: [ persons.id ],
		relationName: 'vehicleDriverLicenseCheckedBy',
	}),
	instructedBy: one(persons, {
		fields: [ vehicleDriverQualifications.instructedBy ],
		references: [ persons.id ],
		relationName: 'vehicleDriverInstructedBy',
	}),
}))
