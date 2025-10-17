import { createUpdateSchema } from 'drizzle-zod'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('workflowSteps.update')

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		workflowStep: idSchema,
	}).parseAsync(data))

	const body = await readValidatedBody(event, async (data) =>
		await createUpdateSchema(workflowSteps).omit({ id: true }).parseAsync(data))

	const database = useDatabase()

	const result = await database
		.update(workflowSteps)
		.set(body)
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
