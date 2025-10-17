import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('workflowMutations.read')

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		workflowMutation: idSchema,
	}).parseAsync(data))

	const database = useDatabase()

	const mutation = await database.query.workflowMutations.findFirst({
		where: eq(workflowMutations.id, params.workflowMutation),
		columns: {
			id: false,
			workflow: false,
		},
	})

	if(!mutation) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Workflow-Mutation nicht gefunden',
			data: {
				workflowMutationId: params.workflowMutation,
			},
		})
	}

	return mutation
})
