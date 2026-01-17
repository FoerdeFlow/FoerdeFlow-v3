import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('courseTypes.delete')

	const database = useDatabase()

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		courseType: idSchema,
	}).parseAsync(data))

	const result = await database
		.delete(courseTypes)
		.where(eq(courseTypes.id, params.courseType))

	if(result.rowCount === 0) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Abschluss nicht gefunden',
			data: {
				courseTypeId: params.courseType,
			},
		})
	}
})
