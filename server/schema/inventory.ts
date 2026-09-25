import { relations, sql } from 'drizzle-orm'
import {
	check,
	pgTable,
	timestamp,
	unique,
	uniqueIndex,
	uuid,
	varchar,
} from 'drizzle-orm/pg-core'

import { locations } from './location'
import { organizationItems } from './organizationItem'
import { persons } from './person'

/**
 * Ein Gegenstand aus dem Inventar eines Gremiums.
 *
 * Jede Zeile steht für genau ein Stück, auch wenn zwanzig gleiche Bierbänke im
 * Keller stehen. Erst dadurch ist eindeutig, welches Stück gerade verliehen
 * ist und wer es hat; eine Bestandsmenge könnte das nicht.
 */
export const inventoryItems = pgTable('inventory_items', {
	id: uuid().notNull().primaryKey().defaultRandom(),
	organizationItem: uuid().notNull().references(() => organizationItems.id),
	// Die Nummer auf dem Aufkleber. Nicht jeder Gegenstand trägt eine.
	inventoryNumber: varchar({ length: 16 }),
	name: varchar({ length: 256 }).notNull(),
	description: varchar({ length: 4096 }),
	// Der Lagerort aus dem Ortskatalog, solange der Gegenstand nicht verliehen ist.
	location: uuid().references(() => locations.id),
}, (table) => [
	// Je Gremium eindeutig, nicht hochschulweit: zwei Gremien vergeben ihre
	// Nummern unabhängig voneinander. Zeilen ohne Nummer stören sich nicht.
	unique('inventory_item_number')
		.on(table.organizationItem, table.inventoryNumber),
])

/**
 * Die Ausleihe eines Gegenstands an eine Person.
 *
 * Eine Zeile entsteht bei der Herausgabe und bleibt danach stehen: die Rückgabe
 * füllt nur `returnedAt` und `returnedTo`. Die Historie eines Gegenstands ist
 * damit die Liste seiner Ausleihen, und `returnedAt IS NULL` bedeutet „hat
 * jemand gerade“.
 *
 * `lentBy` und `returnedTo` halten fest, wer herausgegeben beziehungsweise
 * angenommen hat. Sie bleiben leer, wenn die Aktion nicht von einer angemeldeten
 * Person ausgeht, etwa über einen API-Schlüssel.
 */
export const inventoryLoans = pgTable('inventory_loans', {
	id: uuid().notNull().primaryKey().defaultRandom(),
	item: uuid().notNull().references(() => inventoryItems.id),
	borrower: uuid().notNull().references(() => persons.id),
	lentAt: timestamp().notNull(),
	dueAt: timestamp().notNull(),
	returnedAt: timestamp(),
	lentBy: uuid().references(() => persons.id),
	returnedTo: uuid().references(() => persons.id),
	// Bemerkung zur Ausleihe, etwa zum Zustand bei der Rückgabe.
	note: varchar({ length: 4096 }),
}, (table) => [
	// Ein Gegenstand kann nicht zweimal gleichzeitig verliehen sein. Die Regel
	// steht in der Datenbank, weil zwei Herausgaben sonst im selben Moment
	// aneinander vorbeilaufen könnten.
	uniqueIndex('one_open_loan_per_item')
		.on(table.item)
		.where(sql`${table.returnedAt} is null`),
	check(
		'valid_loan_range',
		sql`
			${table.dueAt} >= ${table.lentAt} AND
			(${table.returnedAt} IS NULL OR ${table.returnedAt} >= ${table.lentAt})
		`,
	),
	// Eine annehmende Person ohne Rückgabe ergibt keinen Sinn. Umgekehrt schon:
	// geht die Rückgabe nicht von einer angemeldeten Person aus, bleibt offen,
	// wer sie entgegengenommen hat.
	check(
		'valid_loan_return',
		sql`${table.returnedTo} IS NULL OR ${table.returnedAt} IS NOT NULL`,
	),
])

export const inventoryItemsRelations = relations(inventoryItems, ({ one, many }) => ({
	organizationItem: one(organizationItems, {
		fields: [ inventoryItems.organizationItem ],
		references: [ organizationItems.id ],
	}),
	location: one(locations, {
		fields: [ inventoryItems.location ],
		references: [ locations.id ],
	}),
	loans: many(inventoryLoans),
}))

export const inventoryLoansRelations = relations(inventoryLoans, ({ one }) => ({
	item: one(inventoryItems, {
		fields: [ inventoryLoans.item ],
		references: [ inventoryItems.id ],
	}),
	borrower: one(persons, {
		fields: [ inventoryLoans.borrower ],
		references: [ persons.id ],
		relationName: 'borrower',
	}),
	lentBy: one(persons, {
		fields: [ inventoryLoans.lentBy ],
		references: [ persons.id ],
		relationName: 'lentBy',
	}),
	returnedTo: one(persons, {
		fields: [ inventoryLoans.returnedTo ],
		references: [ persons.id ],
		relationName: 'returnedTo',
	}),
}))
