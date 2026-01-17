import {
	pgTable,
	pgEnum,
	uuid,
	varchar,
	integer,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { courses } from './university'

export const genders = pgEnum('genders', [
	'male',
	'female',
	'non_binary',
	'diverse',
])

export const persons = pgTable('persons', {
	id: uuid().notNull().primaryKey().defaultRandom(),
	email: varchar({ length: 256 }).notNull().unique(),
	firstName: varchar({ length: 256 }).notNull(),
	lastName: varchar({ length: 256 }).notNull(),
	callName: varchar({ length: 256 }),
	gender: genders(),
	pronouns: varchar({ length: 256 }),
	matriculationNumber: integer(),
	course: uuid().references(() => courses.id),
	postalAddress: varchar({ length: 256 }),
})

export const personsRelations = relations(persons, ({ one }) => ({
	course: one(courses, {
		fields: [ persons.course ],
		references: [ courses.id ],
	}),
}))
