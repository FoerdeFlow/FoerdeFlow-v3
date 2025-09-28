import {
	relations,
	sql,
} from 'drizzle-orm'
import {
	pgTable,
	boolean,
	uuid,
	varchar,
	unique,
	check,
} from 'drizzle-orm/pg-core'

import { persons } from './person'
import { organizationTypes, organizationItems } from './organizationItem'
import { membershipTypes } from './membership'

export const roles = pgTable('roles', {
	id: uuid().notNull().primaryKey().defaultRandom(),
	code: varchar({ length: 16 }).notNull().unique(),
	name: varchar({ length: 256 }).notNull(),
	isAdmin: boolean().notNull().default(false),
})

export const roleOccupants = pgTable('role_occupants', {
	id: uuid().notNull().primaryKey().defaultRandom(),
	role: uuid().notNull().references(() => roles.id),
	person: uuid().references(() => persons.id),
	organizationType: uuid().references(() => organizationTypes.id),
	organizationItem: uuid().references(() => organizationItems.id),
	membershipType: uuid().references(() => membershipTypes.id),
}, (table) => [
	check('occupant_type', sql`(
		${table.person} IS NULL AND
		${table.organizationItem} IS NULL AND
		${table.organizationType} IS NULL AND
		${table.membershipType} IS NULL
	) OR (
		${table.person} IS NOT NULL AND
		${table.organizationItem} IS NULL AND
		${table.organizationType} IS NULL AND
		${table.membershipType} IS NULL
	) OR (
		${table.person} IS NULL AND
		(
			(
				${table.organizationItem} IS NOT NULL AND
				${table.organizationType} IS NULL
			) OR (
				${table.organizationItem} IS NULL AND
				${table.organizationType} IS NOT NULL
			)
		)
	)`),
])

export const roleOccupantsRelations = relations(roleOccupants, ({ one }) => ({
	role: one(roles, {
		fields: [ roleOccupants.role ],
		references: [ roles.id ],
	}),
	person: one(persons, {
		fields: [ roleOccupants.person ],
		references: [ persons.id ],
	}),
	organizationType: one(organizationTypes, {
		fields: [ roleOccupants.organizationType ],
		references: [ organizationTypes.id ],
	}),
	organizationItem: one(organizationItems, {
		fields: [ roleOccupants.organizationItem ],
		references: [ organizationItems.id ],
	}),
	membershipType: one(membershipTypes, {
		fields: [ roleOccupants.membershipType ],
		references: [ membershipTypes.id ],
	}),
}))

export const rolePermissions = pgTable('role_permissions', {
	id: uuid().notNull().primaryKey().defaultRandom(),
	role: uuid().notNull().references(() => roles.id),
	permission: varchar({ length: 64 }).notNull(),
}, (table) => [
	unique().on(
		table.role,
		table.permission,
	),
])

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
	role: one(roles, {
		fields: [ rolePermissions.role ],
		references: [ roles.id ],
	}),
}))
