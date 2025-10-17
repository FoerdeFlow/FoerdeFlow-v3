import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('workflowSteps.delete')

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		workflowStep: idSchema,
	}).parseAsync(data))

	const database = useDatabase()

	const result = await database
		.delete(workflowSteps)
		.where(eq(workflowSteps.id, params.workflowStep))

	if(result.rowCount === 0) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Workflow-Schritt nicht gefunden',
			data: {
				workflowStepId: params.workflowStep,
			},
		})
	}
})
