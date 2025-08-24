import {
	relations,
} from 'drizzle-orm'
import {
	pgTable,
	integer,
	uuid,
	varchar,
} from 'drizzle-orm/pg-core'

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
