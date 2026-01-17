import { createUpdateSchema } from 'drizzle-zod'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('courses.update')

	const database = useDatabase()

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		course: idSchema,
	}).parseAsync(data))

	const body = await readValidatedBody(event, async (data) =>
		await createUpdateSchema(courses).omit({ id: true }).parseAsync(data))

	const result = await database
		.update(courses)
		.set(body)
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
