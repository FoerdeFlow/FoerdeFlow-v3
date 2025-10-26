import { eq } from 'drizzle-orm'
import { PgTable } from 'drizzle-orm/pg-core'
import { createInsertSchema } from 'drizzle-zod'
import { z } from 'zod'
import type { EventContext } from '~~/server/types'

const mutationTargetTables = {
	expenseAuthorizations,
} as const

export default defineEventHandler(async (event) => {
	await checkPermission('workflowProcesses.create')

	const body = await readValidatedBody(event, async (data) => await z.strictObject({
		...createInsertSchema(workflowProcesses).omit({
			id: true,
			status: true,
			initiatorType: true,
			initiatorPerson: true,
			initiatorOrganizationItem: true,
		}).shape,
		mutations: z.array(z.strictObject({
			mutation: z.uuid(),
			dataId: z.uuid().nullable(),
			data: z.any().optional(),
		})),
	}).parseAsync(data))

	const database = useDatabase()

	return await database.transaction(async (tx) => {
		const [ result = null ] = await tx.insert(workflowProcesses)
			.values({
				...body,
				initiatorType: 'person',
				initiatorPerson: (event.context as EventContext).user?.person?.id,
			})
			.returning({
				id: workflowProcesses.id,
				workflow: workflowProcesses.workflow,
			})
		if(!result) {
			throw createError({
				statusCode: 400,
				message: 'Prozess konnte nicht erstellt werden',
			})
		}

		const workflow = await tx.query.workflows.findFirst({
			where: eq(workflows.id, result.workflow),
			with: {
				steps: true,
				mutations: true,
			},
		})
		if(!workflow) throw createError({ statusCode: 500 })

		for(const step of workflow.steps) {
			await tx.insert(workflowProcessSteps).values({
				process: result.id,
				step: step.id,
				status: 'pending',
			})
		}

		for(const mutation of workflow.mutations) {
			const mutationInput = body.mutations.find((item) => item.mutation === mutation.id)
			if(!mutationInput) {
				throw createError({
					statusCode: 400,
					message: `Fehlende Eingabedaten für Mutation ${mutation.id}`,
				})
			}

			const targetTable = mutationTargetTables[mutation.table as keyof typeof mutationTargetTables]
			let schema = null
			switch(mutation.action) {
				case 'create':
					schema = createInsertSchema(targetTable).omit({ id: true })
					break
			}
			if(!schema) {
				throw createError({
					statusCode: 400,
					message: `Unbekannte Aktion für Mutation ${mutation.id}`,
				})
			}
			try {
				await schema.parseAsync(mutationInput.data)
			} catch(error) {
				throw createError({
					statusCode: 400,
					message: `Ungültige Eingabedaten für Mutation ${mutation.id}`,
					data: error,
				})
			}

			await tx.insert(workflowProcessMutations).values({
				process: result.id,
				mutation: mutation.id,
				dataId: mutationInput.dataId,
				data: mutationInput.data,
			})
		}

		return result
	})
})
