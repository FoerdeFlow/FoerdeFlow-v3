import { relations } from 'drizzle-orm'
import {
	boolean,
	integer,
	jsonb,
	pgEnum,
	pgTable,
	timestamp,
	unique,
	uuid,
	varchar,
} from 'drizzle-orm/pg-core'

import { reminderDefaults } from '../../shared/utils/reminder'
import { roles } from './accessControl'
import { organizationItems, organizationTypes } from './organizationItem'
import { persons } from './person'

export const workflows = pgTable('workflows', {
	id: uuid().notNull().primaryKey().defaultRandom(),
	code: varchar({ length: 32 }).notNull(),
	name: varchar({ length: 256 }).notNull(),
	description: varchar({ length: 1024 }),
})

export const workflowsRelations = relations(workflows, ({ many }) => ({
	allowedInitiators: many(workflowAllowedInitiators),
	steps: many(workflowSteps),
	mutations: many(workflowMutations),
	signatures: many(workflowSignatures),
}))

export const workflowAllowedInitiators = pgTable('workflow_allowed_initiators', {
	id: uuid().notNull().primaryKey().defaultRandom(),
	workflow: uuid().notNull().references(() => workflows.id, { onDelete: 'cascade' }),
	person: uuid().references(() => persons.id, { onDelete: 'cascade' }),
	role: uuid().references(() => roles.id, { onDelete: 'cascade' }),
	organizationType: uuid().references(() => organizationTypes.id, { onDelete: 'cascade' }),
	organizationItem: uuid().references(() => organizationItems.id, { onDelete: 'cascade' }),
})

export const workflowAllowedInitiatorsRelations = relations(workflowAllowedInitiators, ({ one }) => ({
	workflow: one(workflows, {
		fields: [ workflowAllowedInitiators.workflow ],
		references: [ workflows.id ],
	}),
	person: one(persons, {
		fields: [ workflowAllowedInitiators.person ],
		references: [ persons.id ],
	}),
	role: one(roles, {
		fields: [ workflowAllowedInitiators.role ],
		references: [ roles.id ],
	}),
	organizationType: one(organizationTypes, {
		fields: [ workflowAllowedInitiators.organizationType ],
		references: [ organizationTypes.id ],
	}),
	organizationItem: one(organizationItems, {
		fields: [ workflowAllowedInitiators.organizationItem ],
		references: [ organizationItems.id ],
	}),
}))

export const workflowParticipants = pgEnum('workflow_participants', [
	'initiator',
	'referencedPerson',
	'organizationItem',
])

export const workflowStepTypes = pgEnum('workflow_step_types', [
	'comment',
	'approval',
	'task',
	'job',
])

export const workflowSteps = pgTable('workflow_steps', {
	id: uuid().notNull().primaryKey().defaultRandom(),
	workflow: uuid().notNull().references(() => workflows.id, { onDelete: 'cascade' }),
	stage: integer().notNull(),
	code: varchar({ length: 32 }).notNull(),
	name: varchar({ length: 256 }).notNull(),
	type: workflowStepTypes().notNull(),
	assignee: workflowParticipants().notNull(),
	assigneeReferencedPerson: varchar({ length: 256 }),
	assigneeOrganizationItem: uuid().references(() => organizationItems.id),
	reminderEnabled: boolean().notNull().default(false),
	reminderInterval: integer().notNull().default(reminderDefaults.interval),
	reminderDelay: integer().notNull().default(reminderDefaults.delay),
	reminderReplyTo: varchar({ length: 256 }),
	reminderSubject: varchar({ length: 512 }).notNull().default(reminderDefaults.subject),
	reminderMessage: varchar({ length: 2048 }).notNull().default(reminderDefaults.message),
})

export const workflowStepsRelations = relations(workflowSteps, ({ one }) => ({
	workflow: one(workflows, {
		fields: [ workflowSteps.workflow ],
		references: [ workflows.id ],
	}),
	assigneeOrganizationItem: one(organizationItems, {
		fields: [ workflowSteps.assigneeOrganizationItem ],
		references: [ organizationItems.id ],
	}),
}))

export const workflowMutationActions = pgEnum('workflow_mutation_actions', [
	'create',
	'update',
	'delete',
])

export const workflowMutations = pgTable('workflow_mutations', {
	id: uuid().notNull().primaryKey().defaultRandom(),
	workflow: uuid().notNull().references(() => workflows.id, { onDelete: 'cascade' }),
	table: varchar({ length: 64 }).notNull(),
	action: workflowMutationActions().notNull(),
	meta: jsonb(),
	presets: jsonb(),
})

export const workflowMutationsRelations = relations(workflowMutations, ({ one }) => ({
	workflow: one(workflows, {
		fields: [ workflowMutations.workflow ],
		references: [ workflows.id ],
	}),
}))

export const workflowSignatures = pgTable('workflow_signatures', {
	id: uuid().notNull().primaryKey().defaultRandom(),
	workflow: uuid().notNull().references(() => workflows.id, { onDelete: 'cascade' }),
	mutation: uuid().notNull().references(() => workflowMutations.id, { onDelete: 'cascade' }),
	stage: integer().notNull(),
	code: varchar({ length: 32 }).notNull(),
	name: varchar({ length: 256 }).notNull(),
	description: varchar({ length: 1024 }),
	hint: varchar({ length: 1024 }),
	lines: jsonb().$type<{ label: string, hint: string | null }[]>().notNull(),
	assignee: workflowParticipants().notNull(),
	assigneeReferencedPerson: varchar({ length: 256 }),
	assigneeOrganizationItem: uuid().references(() => organizationItems.id),
})

export const workflowSignaturesRelations = relations(workflowSignatures, ({ one }) => ({
	workflow: one(workflows, {
		fields: [ workflowSignatures.workflow ],
		references: [ workflows.id ],
	}),
	mutation: one(workflowMutations, {
		fields: [ workflowSignatures.mutation ],
		references: [ workflowMutations.id ],
	}),
	assigneeOrganizationItem: one(organizationItems, {
		fields: [ workflowSignatures.assigneeOrganizationItem ],
		references: [ organizationItems.id ],
	}),
}))

export const workflowStatuses = pgEnum('workflow_statuses', [
	'pending',
	'completed',
	'failed',
])

export const workflowInitiator = pgEnum('workflow_initiator', [
	'person',
	'organizationItem',
])

export const workflowPaperStatuses = pgEnum('workflow_paper_statuses', [
	'notRequired',
	'pending',
	'received',
])

export const workflowProcesses = pgTable('workflow_processes', {
	id: uuid().notNull().primaryKey().defaultRandom(),
	workflow: uuid().notNull().references(() => workflows.id),
	status: workflowStatuses().notNull().default('pending'),
	paperStatus: workflowPaperStatuses().notNull().default('notRequired'),
	initiatorType: workflowInitiator().notNull(),
	initiatorPerson: uuid().references(() => persons.id),
	initiatorOrganizationItem: uuid().references(() => organizationItems.id),
	createdAt: timestamp().notNull().defaultNow(),
})

export const workflowProcessesRelations = relations(workflowProcesses, ({ one, many }) => ({
	workflow: one(workflows, {
		fields: [ workflowProcesses.workflow ],
		references: [ workflows.id ],
	}),
	initiatorPerson: one(persons, {
		fields: [ workflowProcesses.initiatorPerson ],
		references: [ persons.id ],
	}),
	initiatorOrganizationItem: one(organizationItems, {
		fields: [ workflowProcesses.initiatorOrganizationItem ],
		references: [ organizationItems.id ],
	}),
	steps: many(workflowProcessSteps),
	mutations: many(workflowProcessMutations),
	signatures: many(workflowProcessSignatures),
}))

export const workflowStepStatuses = pgEnum('workflow_step_statuses', [
	'pending',
	'completed',
	'failed',
])

export const workflowProcessSteps = pgTable('workflow_process_steps', {
	id: uuid().notNull().primaryKey().defaultRandom(),
	process: uuid().notNull().references(() => workflowProcesses.id, { onDelete: 'cascade' }),
	step: uuid().notNull().references(() => workflowSteps.id),
	status: workflowStepStatuses().notNull().default('pending'),
	comment: varchar({ length: 1024 }),
	modifiedAt: timestamp().notNull().defaultNow(),
	reminderSentAt: timestamp(),
})

export const workflowProcessStepsRelations = relations(workflowProcessSteps, ({ one }) => ({
	process: one(workflowProcesses, {
		fields: [ workflowProcessSteps.process ],
		references: [ workflowProcesses.id ],
	}),
	step: one(workflowSteps, {
		fields: [ workflowProcessSteps.step ],
		references: [ workflowSteps.id ],
	}),
}))

export const workflowProcessMutations = pgTable('workflow_process_mutations', {
	id: uuid().notNull().primaryKey().defaultRandom(),
	process: uuid().notNull().references(() => workflowProcesses.id, { onDelete: 'cascade' }),
	mutation: uuid().notNull().references(() => workflowMutations.id),
	dataId: uuid(),
	data: jsonb(),
})

export const workflowProcessMutationsRelations = relations(workflowProcessMutations, ({ one }) => ({
	process: one(workflowProcesses, {
		fields: [ workflowProcessMutations.process ],
		references: [ workflowProcesses.id ],
	}),
	mutation: one(workflowMutations, {
		fields: [ workflowProcessMutations.mutation ],
		references: [ workflowMutations.id ],
	}),
}))

export const workflowSignatureStatuses = pgEnum('workflow_signature_statuses', [
	'pending',
	'received',
])

export const workflowProcessSignatures = pgTable('workflow_process_signatures', {
	id: uuid().notNull().primaryKey().defaultRandom(),
	process: uuid().notNull().references(() => workflowProcesses.id, { onDelete: 'cascade' }),
	signature: uuid().notNull().references(() => workflowSignatures.id),
	status: workflowSignatureStatuses().notNull().default('pending'),
	comment: varchar({ length: 1024 }),
	confirmedBy: uuid().references(() => persons.id),
	confirmedAt: timestamp(),
	modifiedAt: timestamp().notNull().defaultNow(),
}, (table) => [
	unique('workflow_process_signature_unique')
		.on(table.process, table.signature),
])

export const workflowProcessSignaturesRelations = relations(workflowProcessSignatures, ({ one }) => ({
	process: one(workflowProcesses, {
		fields: [ workflowProcessSignatures.process ],
		references: [ workflowProcesses.id ],
	}),
	signature: one(workflowSignatures, {
		fields: [ workflowProcessSignatures.signature ],
		references: [ workflowSignatures.id ],
	}),
	confirmedBy: one(persons, {
		fields: [ workflowProcessSignatures.confirmedBy ],
		references: [ persons.id ],
	}),
}))
