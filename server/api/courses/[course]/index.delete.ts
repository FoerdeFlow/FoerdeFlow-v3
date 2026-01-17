import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('courses.delete')

	const database = useDatabase()

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		course: idSchema,
	}).parseAsync(data))

	const result = await database
		.delete(courses)
		.where(eq(courses.id, params.course))

	if(result.rowCount === 0) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Studiengang nicht gefunden',
			data: {
				courseId: params.course,
			},
		})
	}
})
