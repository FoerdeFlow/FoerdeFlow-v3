import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('workflowSignatures.read')

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		workflowSignature: idSchema,
	}).parseAsync(data))

	const database = useDatabase()

	const signature = await database.query.workflowSignatures.findFirst({
		where: eq(workflowSignatures.id, params.workflowSignature),
		with: {
			assigneeOrganizationItem: true,
		},
		columns: {
			id: false,
			workflow: false,
			assigneeOrganizationItem: false,
		},
	})

	if(!signature) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Unterschrift nicht gefunden',
			data: {
				workflowSignatureId: params.workflowSignature,
			},
		})
	}

	return signature
})
