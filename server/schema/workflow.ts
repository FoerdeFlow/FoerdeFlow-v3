import {
	integer,
	jsonb,
	pgEnum,
	pgTable,
	uuid,
	varchar,
} from 'drizzle-orm/pg-core'

import { relations } from 'drizzle-orm'
import { organizationItems } from './organizationItem'

export const workflows = pgTable('workflows', {
	id: uuid().notNull().primaryKey().defaultRandom(),
	code: varchar({ length: 32 }).notNull(),
	name: varchar({ length: 256 }).notNull(),
})

export const workflowParticipants = pgEnum('workflow_participants', [
	'initiator',
	'organizationItem',
])

export const workflowStepTypes = pgEnum('workflow_step_types', [
	'comment',
	'approval',
	'task',
])

export const workflowSteps = pgTable('workflow_steps', {
	id: uuid().notNull().primaryKey().defaultRandom(),
	workflow: uuid().notNull().references(() => workflows.id, { onDelete: 'cascade' }),
	stage: integer().notNull(),
	code: varchar({ length: 32 }).notNull(),
	name: varchar({ length: 256 }).notNull(),
	type: workflowStepTypes().notNull(),
	assignee: workflowParticipants().notNull(),
	assigneeOrganizationItem: uuid().references(() => organizationItems.id),
})

export const workflowStepsRelations = relations(workflowSteps, ({ one }) => ({
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
})

export const workflowStatuses = pgEnum('workflow_statuses', [
	'pending',
	'completed',
	'failed',
])

export const workflowProcesses = pgTable('workflow_processes', {
	id: uuid().notNull().primaryKey().defaultRandom(),
	workflow: uuid().notNull().references(() => workflows.id),
	status: workflowStatuses().notNull().default('pending'),
	initiator: uuid().references(() => organizationItems.id),
})

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
})

export const workflowProcessMutations = pgTable('workflow_process_mutations', {
	id: uuid().notNull().primaryKey().defaultRandom(),
	process: uuid().notNull().references(() => workflowProcesses.id, { onDelete: 'cascade' }),
	mutation: uuid().notNull().references(() => workflowMutations.id),
	dataId: uuid(),
	data: jsonb(),
})
