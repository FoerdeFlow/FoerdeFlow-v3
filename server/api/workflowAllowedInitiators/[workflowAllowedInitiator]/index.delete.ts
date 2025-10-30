import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('workflowAllowedInitiators.delete')

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		workflowAllowedInitiator: idSchema,
	}).parseAsync(data))

	const database = useDatabase()

	const result = await database
		.delete(workflowAllowedInitiators)
		.where(eq(workflowAllowedInitiators.id, params.workflowAllowedInitiator))

	if(result.rowCount === 0) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Zugelassener Workflow-Initiator nicht gefunden',
			data: {
				workflowAllowedInitiatorId: params.workflowAllowedInitiator,
			},
		})
	}
})
