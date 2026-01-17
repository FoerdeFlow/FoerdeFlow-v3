import {
	relations,
} from 'drizzle-orm'
import {
	pgTable,
	uuid,
	varchar,
	date,
} from 'drizzle-orm/pg-core'
import { persons } from './person'
import { organizationItems } from './organizationItem'

export const elections = pgTable('elections', {
	id: uuid().notNull().primaryKey().defaultRandom(),
	title: varchar({ length: 256 }).notNull(),
	date: date().notNull(),
})

export const electionCommittees = pgTable('election_committees', {
	id: uuid().notNull().primaryKey().defaultRandom(),
	election: uuid().notNull().references(() => elections.id),
	committee: uuid().notNull().references(() => organizationItems.id),
})

export const electionCommitteesRelations = relations(electionCommittees, ({ one }) => ({
	election: one(elections, {
		fields: [ electionCommittees.election ],
		references: [ elections.id ],
	}),
	committee: one(organizationItems, {
		fields: [ electionCommittees.committee ],
		references: [ organizationItems.id ],
	}),
}))

export const electionProposals = pgTable('election_proposals', {
	id: uuid().notNull().primaryKey().defaultRandom(),
	electionCommittee: uuid().notNull().references(() => electionCommittees.id),
	submitter: uuid().notNull().references(() => persons.id),
})

export const electionProposalsRelations = relations(electionProposals, ({ one }) => ({
	electionCommittee: one(electionCommittees, {
		fields: [ electionProposals.electionCommittee ],
		references: [ electionCommittees.id ],
	}),
	submitter: one(persons, {
		fields: [ electionProposals.submitter ],
		references: [ persons.id ],
	}),
}))

export const candidates = pgTable('candidates', {
	id: uuid().notNull().primaryKey().defaultRandom(),
	electionProposal: uuid().notNull().references(() => electionProposals.id),
	candidate: uuid().notNull().references(() => persons.id),
	applicationLetter: varchar({ length: 2048 }),
})

export const candidatesRelations = relations(candidates, ({ one }) => ({
	electionProposal: one(electionProposals, {
		fields: [ candidates.electionProposal ],
		references: [ electionProposals.id ],
	}),
	candidate: one(persons, {
		fields: [ candidates.candidate ],
		references: [ persons.id ],
	}),
}))
