import {
	relations,
} from 'drizzle-orm'
import {
	pgTable,
	integer,
	timestamp,
	uuid,
} from 'drizzle-orm/pg-core'

import { rooms } from './building'
import { organizationItems } from './organizationItem'

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
