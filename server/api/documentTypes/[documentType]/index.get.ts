import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('documentTypes.read')

	const database = useDatabase()

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		documentType: idSchema,
	}).parseAsync(data))

	const documentType = await database.query.documentTypes.findFirst({
		where: eq(documentTypes.id, params.documentType),
	})

	if(!documentType) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Vorlagenart nicht gefunden',
			data: {
				documentTypeId: params.documentType,
			},
		})
	}

	return documentType
})
