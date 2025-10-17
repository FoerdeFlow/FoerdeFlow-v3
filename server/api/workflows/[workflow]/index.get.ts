import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('workflows.read')

	const database = useDatabase()

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		workflow: idSchema,
	}).parseAsync(data))

	const workflow = await database.query.workflows.findFirst({
		where: eq(workflows.id, params.workflow),
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

	return workflow
})
