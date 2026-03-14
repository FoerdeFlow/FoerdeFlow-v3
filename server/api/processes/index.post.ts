import { eq } from 'drizzle-orm'
import { createInsertSchema } from 'drizzle-zod'
import { writeFile } from 'node:fs/promises'
import { z } from 'zod'
import type { EventContext } from '~~/server/types'

const mutationTargetTables = {
	expenseAuthorizations,
} as const

export default defineEventHandler(async (event) => {
	const formData = await readMultipartFormData(event)
	if (!formData) {
		throw createError({
			statusCode: 400,
			message: 'Expected multipart form data',
		})
	}

	const entries = Object.fromEntries(formData.map((entry) => [entry.name, entry.data]))
	if (!entries.data) {
		throw createError({
			statusCode: 400,
			message: 'Missing data field in form data',
		})
	}

	const body = await z.strictObject({
		...createInsertSchema(workflowProcesses).omit({
			id: true,
			status: true,
			initiatorPerson: true,
		}).shape,
		mutations: z.array(z.strictObject({
			mutation: z.uuid(),
			dataId: z.uuid().nullable(),
		})),
	}).parseAsync(JSON.parse(entries.data.toString('utf8')))

	const database = useDatabase()

	const allowedInitiators = await database.query.workflowAllowedInitiators.findMany({
		where: eq(workflowAllowedInitiators.workflow, body.workflow),
		columns: {
			person: true,
			role: true,
			organizationItem: true,
			organizationType: true,
		},
	})
	const context = event.context as EventContext
	const organizationTypeResult = body.initiatorOrganizationItem
		? await database.query.organizationItems.findFirst({
			where: eq(organizationItems.id, body.initiatorOrganizationItem),
			columns: {
				organizationType: true,
			},
		})
		: null

	switch (body.initiatorType) {
		case 'person':
			if (body.initiatorOrganizationItem) {
				throw createError({
					statusCode: 400,
					message: 'initiatorOrganizationItem darf nicht gesetzt sein',
				})
			}
			await checkPermission('workflowProcesses.create')
			if (!allowedInitiators.some((item) =>
				item.person === context.user?.person?.id ||
				context.user?.roles.some((role) => item.role === role.id) ||
				Object.entries(item).every(([key, value]) => key === 'id' || value === null),
			)) {
				throw createError({
					statusCode: 403,
					message: 'Fehlende Berechtigung zur Initiierung dieses Workflows',
				})
			}
			break
		case 'organizationItem':
			if (!body.initiatorOrganizationItem) {
				throw createError({
					statusCode: 400,
					message: 'initiatorOrganizationItem ist erforderlich',
				})
			}
			await checkPermission(
				'workflowProcesses.create',
				{ organizationItem: body.initiatorOrganizationItem },
				{ exactScopeMatch: true },
			)
			if (!allowedInitiators.some((item) =>
				item.organizationItem === body.initiatorOrganizationItem ||
				item.organizationType === organizationTypeResult?.organizationType,
			)) {
				throw createError({
					statusCode: 403,
					message: 'Fehlende Berechtigung zur Initiierung dieses Workflows',
				})
			}
			break
	}

	const attachmentFiles: Record<string, Buffer> = {}

	const response = await database.transaction(async (tx) => {
		const [result = null] = await tx.insert(workflowProcesses)
			.values({
				...body,
				...(body.initiatorType === 'person'
					? {
						initiatorPerson: (event.context as EventContext).user?.person?.id,
					}
					: {}
				),
			})
			.returning({
				id: workflowProcesses.id,
				workflow: workflowProcesses.workflow,
			})
		if (!result) {
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
		if (!workflow) throw createError({ statusCode: 500 })

		for (const step of workflow.steps) {
			await tx.insert(workflowProcessSteps).values({
				process: result.id,
				step: step.id,
				status: 'pending',
			})
		}

		for (const mutation of workflow.mutations) {
			const mutationInput = body.mutations.find((item) => item.mutation === mutation.id)
			if (!mutationInput) {
				throw createError({
					statusCode: 400,
					message: `Fehlende Eingabedaten für Mutation ${mutation.id}`,
				})
			}

			const schema = processSchemas[mutation.table as keyof typeof processSchemas]?.[mutation.action as 'create' | 'update' | 'delete'] as any
			if (!schema) {
				throw createError({
					statusCode: 400,
					message: `Unbekannte Aktion für Mutation ${mutation.id}`,
				})
			}
			let data = null
			try {
				data = await schema.parseAsync(JSON.parse(entries[`mutation_${mutation.id}_data`]))
			} catch (error) {
				throw createError({
					statusCode: 400,
					message: `Ungültige Eingabedaten für Mutation ${mutation.id}`,
					data: error,
				})
			}

			const attachments = processSchemas[mutation.table as keyof typeof processSchemas]?.attachments || [] as string[]
			for (const attachment of attachments) {
				const attachmentData = entries[`mutation_${mutation.id}_attachment_${attachment}`]
				attachmentFiles[`${mutation.id}_${attachment}`] = attachmentData
			}

			await tx.insert(workflowProcessMutations).values({
				process: result.id,
				mutation: mutation.id,
				dataId: mutationInput.dataId,
				data,
			})
		}

		return result
	})

	for (const [key, file] of Object.entries(attachmentFiles)) {
		await writeFile(`./data/${response.id}_${key}`, file)
	}
	return response
})
