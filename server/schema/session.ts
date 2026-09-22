import {
	relations,
} from 'drizzle-orm'
import {
	integer,
	pgEnum,
	pgTable,
	timestamp,
	uuid,
} from 'drizzle-orm/pg-core'

import { locations } from './location'
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
	location: uuid().notNull().references(() => locations.id),
	// Der Videokonferenzraum einer hybriden oder rein digitalen Sitzung.
	onlineLocation: uuid().references(() => locations.id),
})

export const sessionsRelations = relations(sessions, ({ one }) => ({
	organizationItem: one(organizationItems, {
		fields: [ sessions.organizationItem ],
		references: [ organizationItems.id ],
	}),
	location: one(locations, {
		fields: [ sessions.location ],
		references: [ locations.id ],
		relationName: 'location',
	}),
	onlineLocation: one(locations, {
		fields: [ sessions.onlineLocation ],
		references: [ locations.id ],
		relationName: 'onlineLocation',
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
