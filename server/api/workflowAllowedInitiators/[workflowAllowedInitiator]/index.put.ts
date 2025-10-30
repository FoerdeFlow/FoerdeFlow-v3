import { createUpdateSchema } from 'drizzle-zod'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('workflowAllowedInitiators.update')

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		workflowAllowedInitiator: idSchema,
	}).parseAsync(data))

	const body = await readValidatedBody(event, async (data) =>
		await createUpdateSchema(workflowAllowedInitiators).omit({ id: true }).parseAsync(data))

	const database = useDatabase()

	const result = await database
		.update(workflowAllowedInitiators)
		.set(body)
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
