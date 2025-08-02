import {
	relations,
	sql,
} from 'drizzle-orm'

import {
	pgTable,
	pgEnum,
	integer,
	timestamp,
	uuid,
	varchar,
	AnyPgColumn,
	check,
} from 'drizzle-orm/pg-core'

export const persons = pgTable('persons', {
	id: uuid().notNull().primaryKey().defaultRandom(),
	email: varchar({ length: 256 }).notNull().unique(),
	firstName: varchar({ length: 256 }).notNull(),
	lastName: varchar({ length: 256 }).notNull(),
	callName: varchar({ length: 256 }),
	pronouns: varchar({ length: 256 }),
})

export const organizationTypes = pgTable('organization_types', {
	id: uuid().notNull().primaryKey().defaultRandom(),
	code: varchar({ length: 32 }).notNull().unique(),
	name: varchar({ length: 256 }).notNull().unique(),
})

export const organizationItems = pgTable('organization_items', {
	id: uuid().notNull().primaryKey().defaultRandom(),
	organizationType: uuid().notNull().references(() => organizationTypes.id),
	parent: uuid().references((): AnyPgColumn => organizationItems.id),
	code: varchar({ length: 32 }).notNull().unique(),
	name: varchar({ length: 256 }).notNull().unique(),
})

export const organizationItemsRelations = relations(organizationItems, ({ one, many }) => ({
	parent: one(organizationItems, {
		fields: [ organizationItems.parent ],
		references: [ organizationItems.id ],
		relationName: 'parent',
	}),
	children: many(organizationItems, {
		relationName: 'parent',
	}),
	organizationType: one(organizationTypes, {
		fields: [ organizationItems.organizationType ],
		references: [ organizationTypes.id ],
	}),
}))

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
	'organization_item',
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
}, table => [
	check('member_type', sql`(
		${table.memberType} = 'person' AND
		${table.memberPerson} IS NOT NULL AND
		${table.memberOrganizationItem} IS NULL
	) OR (
		${table.memberType} = 'organization_item' AND
		${table.memberOrganizationItem} IS NOT NULL AND
		${table.memberPerson} IS NULL
	)`),
	check('date_order', sql`${table.startDate} IS NULL OR ${table.endDate} IS NULL OR ${table.startDate} < ${table.endDate}`),
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

export const buildings = pgTable('buildings', {
	id: uuid().notNull().primaryKey().defaultRandom(),
	code: varchar({ length: 16 }).notNull().unique(),
	name: varchar({ length: 256 }).notNull(),
	postalAddress: varchar({ length: 256 }).notNull(),
})

export const rooms = pgTable('rooms', {
	id: uuid().notNull().primaryKey().defaultRandom(),
	building: uuid().notNull().references(() => buildings.id),
	level: integer().notNull(),
	code: varchar({ length: 16 }).notNull().unique(),
	name: varchar({ length: 256 }).notNull(),
	capacity: integer().notNull(),
})

export const roomsRelations = relations(rooms, ({ one }) => ({
	building: one(buildings, {
		fields: [ rooms.building ],
		references: [ buildings.id ],
	}),
}))

export const sessions = pgTable('sessions', {
	id: uuid().notNull().primaryKey().defaultRandom(),
	organizationItem: uuid().notNull().references(() => organizationItems.id),
	period: integer().notNull(),
	number: integer().notNull(),
	plannedDate: timestamp().notNull(),
	startDate: timestamp(),
	endDate: timestamp(),
	room: uuid().notNull().references(() => rooms.id),
})

export const sessionsRelations = relations(sessions, ({ one }) => ({
	organizationItem: one(organizationItems, {
		fields: [ sessions.organizationItem ],
		references: [ organizationItems.id ],
	}),
	room: one(rooms, {
		fields: [ sessions.room ],
		references: [ rooms.id ],
	}),
}))