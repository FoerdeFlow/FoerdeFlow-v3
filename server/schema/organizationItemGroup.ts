import {
	relations,
} from 'drizzle-orm'
import {
	pgTable,
	uuid,
	varchar,
	boolean,
} from 'drizzle-orm/pg-core'

import { organizationItems } from './organizationItem'
import { membershipTypes } from './membership'

export const organizationItemGroups = pgTable('organization_item_groups', {
	id: uuid().notNull().primaryKey().defaultRandom(),
	organizationItem: uuid().notNull().references(() => organizationItems.id),
	groupName: varchar({ length: 256 }).notNull(),
	roleName: varchar({ length: 256 }).notNull(),
	isSessionParticipant: boolean().notNull(),
})

export const organizationItemGroupsRelations = relations(organizationItemGroups, ({ one, many }) => ({
	organizationItem: one(organizationItems, {
		fields: [ organizationItemGroups.organizationItem ],
		references: [ organizationItems.id ],
		relationName: 'organizationItem',
	}),
	members: many(organizationItemGroupMembers, {
		relationName: 'organizationItemGroup',
	}),
}))

export const organizationItemGroupMembers = pgTable('organization_item_group_members', {
	id: uuid().notNull().primaryKey().defaultRandom(),
	organizationItemGroup: uuid().notNull().references(() => organizationItemGroups.id, { onDelete: 'cascade' }),
	organizationItem: uuid().notNull().references(() => organizationItems.id),
	membershipType: uuid().notNull().references(() => membershipTypes.id),
})

export const organizationItemGroupMembersRelations = relations(organizationItemGroupMembers, ({ one }) => ({
	organizationItemGroup: one(organizationItemGroups, {
		fields: [ organizationItemGroupMembers.organizationItemGroup ],
		references: [ organizationItemGroups.id ],
		relationName: 'organizationItemGroup',
	}),
	organizationItem: one(organizationItems, {
		fields: [ organizationItemGroupMembers.organizationItem ],
		references: [ organizationItems.id ],
		relationName: 'organizationItem',
	}),
	membershipType: one(membershipTypes, {
		fields: [ organizationItemGroupMembers.membershipType ],
		references: [ membershipTypes.id ],
		relationName: 'membershipType',
	}),
}))
