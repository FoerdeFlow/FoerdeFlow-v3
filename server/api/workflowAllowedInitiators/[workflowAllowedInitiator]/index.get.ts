import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('workflowAllowedInitiators.read')

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		workflowAllowedInitiator: idSchema,
	}).parseAsync(data))

	const database = useDatabase()

	const allowedInitiator = await database.query.workflowAllowedInitiators.findFirst({
		where: eq(workflowAllowedInitiators.id, params.workflowAllowedInitiator),
		with: {
			person: true,
			role: true,
			organizationType: true,
			organizationItem: true,
		},
		columns: {
			id: false,
			workflow: false,
			person: false,
			role: false,
			organizationType: false,
			organizationItem: false,
		},
	})

	if(!allowedInitiator) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Zugelassener Workflow-Initiator nicht gefunden',
			data: {
				workflowAllowedInitiatorId: params.workflowAllowedInitiator,
			},
		})
	}

	return allowedInitiator
})
