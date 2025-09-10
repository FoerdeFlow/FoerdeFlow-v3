import {
	relations,
} from 'drizzle-orm'
import {
	pgTable,
	pgEnum,
	integer,
	timestamp,
	uuid,
} from 'drizzle-orm/pg-core'

import { rooms } from './building'
import { organizationItems } from './organizationItem'
import { persons } from './person'

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

export const sessionAttendanceStatuses = pgEnum('session_attendance_statuses', [
	'present',
	'absent',
	'excused',
	'late',
])

export const sessionAttendances = pgTable('session_attendances', {
	id: uuid().notNull().primaryKey().defaultRandom(),
	session: uuid().notNull().references(() => sessions.id),
	person: uuid().notNull().references(() => persons.id),
	status: sessionAttendanceStatuses().notNull(),
})

export const sessionAttendancesRelations = relations(sessionAttendances, ({ one }) => ({
	session: one(sessions, {
		fields: [ sessionAttendances.session ],
		references: [ sessions.id ],
	}),
	person: one(persons, {
		fields: [ sessionAttendances.person ],
		references: [ persons.id ],
	}),
}))
