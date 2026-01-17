import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('councils.delete')

	const database = useDatabase()

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		council: idSchema,
	}).parseAsync(data))

	const result = await database
		.delete(councils)
		.where(eq(councils.id, params.council))

	if(result.rowCount === 0) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Fachschaft nicht gefunden',
			data: {
				councilId: params.council,
			},
		})
	}
})
