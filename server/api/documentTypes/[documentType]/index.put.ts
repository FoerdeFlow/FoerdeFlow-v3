import { createUpdateSchema } from 'drizzle-zod'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('documentTypes.update')

	const database = useDatabase()

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		documentType: idSchema,
	}).parseAsync(data))

	const body = await readValidatedBody(event, async (data) =>
		await createUpdateSchema(documentTypes).omit({ id: true }).parseAsync(data))

	const result = await database
		.update(documentTypes)
		.set(body)
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
