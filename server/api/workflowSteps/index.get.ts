import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('workflowSteps.read')

	const query = await getValidatedQuery(event, async (data) => await z.object({
		workflow: z.uuid(),
	}).parseAsync(data))

	const database = useDatabase()

	const workflow = await database.query.workflows.findFirst({
		where: eq(workflows.id, query.workflow),
		columns: {
			id: true,
		},
	})

	if(!workflow) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Workflow nicht gefunden',
			data: {
				workflowId: query.workflow,
			},
		})
	}

	const steps = await database.query.workflowSteps.findMany({
		where: eq(workflowSteps.workflow, query.workflow),
		with: {
			assigneeOrganizationItem: true,
		},
		columns: {
			workflow: false,
			assigneeOrganizationItem: false,
		},
		orderBy: (step, { asc }) => asc(step.stage),
	})

	return steps
})
