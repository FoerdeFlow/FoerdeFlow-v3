import { relations } from 'drizzle-orm'
import { pgTable, uuid, varchar } from 'drizzle-orm/pg-core'

export const councils = pgTable('councils', {
	id: uuid().notNull().primaryKey().defaultRandom(),
	code: varchar({ length: 16 }).notNull().unique(),
	name: varchar({ length: 256 }).notNull(),
})

export const departments = pgTable('departments', {
	id: uuid().notNull().primaryKey().defaultRandom(),
	code: varchar({ length: 16 }).notNull().unique(),
	name: varchar({ length: 256 }).notNull(),
})

export const courseTypes = pgTable('course_types', {
	id: uuid().notNull().primaryKey().defaultRandom(),
	code: varchar({ length: 16 }).notNull().unique(),
	name: varchar({ length: 256 }).notNull(),
})

export const courses = pgTable('courses', {
	id: uuid().notNull().primaryKey().defaultRandom(),
	type: uuid().notNull().references(() => courseTypes.id),
	code: varchar({ length: 16 }).notNull().unique(),
	name: varchar({ length: 256 }).notNull(),
	council: uuid().notNull().references(() => councils.id),
	department: uuid().notNull().references(() => departments.id),
})

export const coursesRelations = relations(courses, ({ one }) => ({
	type: one(courseTypes, {
		fields: [ courses.type ],
		references: [ courseTypes.id ],
	}),
	council: one(councils, {
		fields: [ courses.council ],
		references: [ councils.id ],
	}),
	department: one(departments, {
		fields: [ courses.department ],
		references: [ departments.id ],
	}),
}))
