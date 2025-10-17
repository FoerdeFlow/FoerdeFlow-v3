import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('workflowMutations.delete')

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		workflowMutation: idSchema,
	}).parseAsync(data))

	const database = useDatabase()

	const result = await database
		.delete(workflowMutations)
		.where(eq(workflowMutations.id, params.workflowMutation))

	if(result.rowCount === 0) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Workflow-Mutation nicht gefunden',
			data: {
				workflowMutationId: params.workflowMutation,
			},
		})
	}
})
