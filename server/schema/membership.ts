import {
	relations,
	sql,
} from 'drizzle-orm'
import {
	pgTable,
	pgEnum,
	timestamp,
	uuid,
	varchar,
	check,
} from 'drizzle-orm/pg-core'

import { organizationItems } from './organizationItem'
import { persons } from './person'

export const membershipTypes = pgTable('membership_types', {
	id: uuid().notNull().primaryKey().defaultRandom(),
	code: varchar({ length: 32 }).notNull().unique(),
	name: varchar({ length: 256 }).notNull().unique(),
})

export const membershipEndReasons = pgTable('membership_end_reasons', {
	id: uuid().notNull().primaryKey().defaultRandom(),
	code: varchar({ length: 32 }).notNull().unique(),
	name: varchar({ length: 256 }).notNull().unique(),
})

export const memberTypes = pgEnum('member_types', [
	'person',
	'organizationItem',
])

export const memberships = pgTable('memberships', {
	id: uuid().notNull().primaryKey().defaultRandom(),
	organizationItem: uuid().notNull().references(() => organizationItems.id),
	membershipType: uuid().notNull().references(() => membershipTypes.id),
	comment: varchar({ length: 1024 }),
	startDate: timestamp(),
	endDate: timestamp(),
	endReason: uuid().references(() => membershipEndReasons.id),
	memberType: memberTypes().notNull(),
	memberPerson: uuid().references(() => persons.id),
	memberOrganizationItem: uuid().references(() => organizationItems.id),
}, (table) => [
	check('member_type', sql`(
		${table.memberType} = 'person' AND
		${table.memberPerson} IS NOT NULL AND
		${table.memberOrganizationItem} IS NULL
	) OR (
		${table.memberType} = 'organization_item' AND
		${table.memberOrganizationItem} IS NOT NULL AND
		${table.memberPerson} IS NULL
	)`),
	check(
		'date_order',
		sql`${table.startDate} IS NULL OR ${table.endDate} IS NULL OR ${table.startDate} < ${table.endDate}`,
	),
])

export const membershipsRelations = relations(memberships, ({ one }) => ({
	organizationItem: one(organizationItems, {
		fields: [ memberships.organizationItem ],
		references: [ organizationItems.id ],
	}),
	membershipType: one(membershipTypes, {
		fields: [ memberships.membershipType ],
		references: [ membershipTypes.id ],
	}),
	endReason: one(membershipEndReasons, {
		fields: [ memberships.endReason ],
		references: [ membershipEndReasons.id ],
	}),
	memberPerson: one(persons, {
		fields: [ memberships.memberPerson ],
		references: [ persons.id ],
	}),
	memberOrganizationItem: one(organizationItems, {
		fields: [ memberships.memberOrganizationItem ],
		references: [ organizationItems.id ],
	}),
}))
