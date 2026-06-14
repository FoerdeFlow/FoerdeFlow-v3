import { eq } from 'drizzle-orm'
import { existsSync } from 'node:fs'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	// await checkPermission('workflows.read')

	const database = useDatabase()

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		workflow: idSchema,
	}).parseAsync(data))

	const workflow = await database.query.workflows.findFirst({
		where: eq(workflows.id, params.workflow),
		with: {
			allowedInitiators: {
				with: {
					person: {
						with: {
							course: true,
						},
						columns: {
							id: true,
							email: true,
							firstName: true,
							lastName: true,
							callName: true,
							gender: true,
							pronouns: true,
						},
					},
					role: true,
					organizationType: {
						with: {
							items: true,
						},
					},
					organizationItem: true,
				},
				columns: {
					workflow: false,
					person: false,
					role: false,
					organizationType: false,
					organizationItem: false,
				},
			},
		},
	})

	if(!workflow) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Workflow nicht gefunden',
			data: {
				workflowId: params.workflow,
			},
		})
	}

	return {
		...workflow,
		allowedInitiators: workflow.allowedInitiators.map((initiator) => ({
			...initiator,
			person: initiator.person
				? {
					...initiator.person,
					hasPhoto: existsSync(`./data/${initiator.person.id}`),
				}
				: null,
		})),
	}
})
