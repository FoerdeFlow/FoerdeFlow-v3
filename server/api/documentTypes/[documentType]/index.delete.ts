import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('documentTypes.delete')

	const database = useDatabase()

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		documentType: idSchema,
	}).parseAsync(data))

	const result = await database
		.delete(documentTypes)
		.where(eq(documentTypes.id, params.documentType))

	if(result.rowCount === 0) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Vorlagenart nicht gefunden',
			data: {
				documentTypeId: params.documentType,
			},
		})
	}
})
