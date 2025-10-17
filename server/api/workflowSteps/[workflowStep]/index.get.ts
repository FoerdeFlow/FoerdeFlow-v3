import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('workflowSteps.read')

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		workflowStep: idSchema,
	}).parseAsync(data))

	const database = useDatabase()

	const step = await database.query.workflowSteps.findFirst({
		where: eq(workflowSteps.id, params.workflowStep),
		with: {
			assigneeOrganizationItem: true,
		},
		columns: {
			id: false,
			workflow: false,
			assigneeOrganizationItem: false,
		},
	})

	if(!step) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Workflow-Schritt nicht gefunden',
			data: {
				workflowStepId: params.workflowStep,
			},
		})
	}

	return step
})
