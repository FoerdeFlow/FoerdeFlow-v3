import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('courses.read')

	const database = useDatabase()

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		course: idSchema,
	}).parseAsync(data))

	const course = await database.query.courses.findFirst({
		where: eq(courses.id, params.course),
		with: {
			type: true,
			department: true,
			council: true,
		},
		columns: {
			type: false,
			department: false,
			council: false,
		},
	})

	if(!course) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Studiengang nicht gefunden',
			data: {
				courseId: params.course,
			},
		})
	}

	return course
})
