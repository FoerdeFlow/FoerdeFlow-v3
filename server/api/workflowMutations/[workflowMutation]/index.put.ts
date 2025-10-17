import { createUpdateSchema } from 'drizzle-zod'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('workflowMutations.update')

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		workflowMutation: idSchema,
	}).parseAsync(data))

	const body = await readValidatedBody(event, async (data) =>
		await createUpdateSchema(workflowMutations).omit({ id: true }).parseAsync(data))

	const database = useDatabase()

	const result = await database
		.update(workflowMutations)
		.set(body)
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
