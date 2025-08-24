import {
	pgTable,
	pgEnum,
	uuid,
	varchar,
} from 'drizzle-orm/pg-core'

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
})
