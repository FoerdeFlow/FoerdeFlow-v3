import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('courseTypes.read')

	const database = useDatabase()

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		courseType: idSchema,
	}).parseAsync(data))

	const courseType = await database.query.courseTypes.findFirst({
		where: eq(courseTypes.id, params.courseType),
	})

	if(!courseType) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Abschluss nicht gefunden',
			data: {
				courseTypeId: params.courseType,
			},
		})
	}

	return courseType
})
