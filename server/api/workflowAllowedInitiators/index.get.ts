import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('workflowAllowedInitiators.read')

	const query = await getValidatedQuery(event, async (data) => await z.object({
		workflow: z.uuid(),
	}).parseAsync(data))

	const database = useDatabase()

	const workflow = await database.query.workflows.findFirst({
		where: eq(workflows.id, query.workflow),
		columns: {
			id: true,
		},
	})

	if(!workflow) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Workflow nicht gefunden',
			data: {
				workflowId: query.workflow,
			},
		})
	}

	const allowedInitiators = await database.query.workflowAllowedInitiators.findMany({
		where: eq(workflowAllowedInitiators.workflow, query.workflow),
		with: {
			person: true,
			role: true,
			organizationType: true,
			organizationItem: true,
		},
		columns: {
			workflow: false,
			person: false,
			role: false,
			organizationType: false,
			organizationItem: false,
		},
	})

	return allowedInitiators
})
