import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const database = useDatabase()

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		processStep: idSchema,
	}).parseAsync(data))

	const step = await database.query.workflowProcessSteps.findFirst({
		where: eq(workflowProcessSteps.id, params.processStep),
		with: {
			step: {
				columns: {
					type: true,
				},
			},
		},
		columns: {
			status: true,
			comment: true,
		},
	})

	if(!step) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Prozessschritt nicht gefunden',
			data: {
				processStepId: params.processStep,
			},
		})
	}

	return step
})
