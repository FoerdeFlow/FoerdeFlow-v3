import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('workflowSignatures.read')

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

	const signatures = await database.query.workflowSignatures.findMany({
		where: eq(workflowSignatures.workflow, query.workflow),
		with: {
			mutation: true,
			assigneeOrganizationItem: true,
		},
		columns: {
			workflow: false,
			mutation: false,
			assigneeOrganizationItem: false,
		},
		orderBy: (signature, { asc }) => asc(signature.stage),
	})

	return signatures
})
