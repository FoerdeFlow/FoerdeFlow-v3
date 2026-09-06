import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('workflowSignatures.delete')

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		workflowSignature: idSchema,
	}).parseAsync(data))

	const database = useDatabase()

	const used = await database.query.workflowProcessSignatures.findFirst({
		where: eq(workflowProcessSignatures.signature, params.workflowSignature),
		columns: {
			id: true,
		},
	})

	if(used) {
		throw createError({
			statusCode: 409,
			statusMessage: 'Unterschrift wird bereits in Prozessen verwendet ' +
				'und kann nicht gelöscht werden',
			data: {
				workflowSignatureId: params.workflowSignature,
			},
		})
	}

	const result = await database
		.delete(workflowSignatures)
		.where(eq(workflowSignatures.id, params.workflowSignature))

	if(result.rowCount === 0) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Unterschrift nicht gefunden',
			data: {
				workflowSignatureId: params.workflowSignature,
			},
		})
	}
})
