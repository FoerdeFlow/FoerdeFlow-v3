import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('workflows.delete')

	const database = useDatabase()

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		workflow: idSchema,
	}).parseAsync(data))

	const result = await database
		.delete(workflows)
		.where(eq(workflows.id, params.workflow))

	if(result.rowCount === 0) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Workflow nicht gefunden',
			data: {
				workflowId: params.workflow,
			},
		})
	}
})
