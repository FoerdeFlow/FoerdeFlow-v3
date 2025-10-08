import {
	pgEnum,
	pgTable,
	uuid,
	varchar,
} from 'drizzle-orm/pg-core'

export const workflowTypes = pgEnum('workflow_types', [
	'',
])

export const workflows = pgTable('workflows', {
	id: uuid().notNull().primaryKey().defaultRandom(),
	type: workflowTypes().notNull().default(''),
})
