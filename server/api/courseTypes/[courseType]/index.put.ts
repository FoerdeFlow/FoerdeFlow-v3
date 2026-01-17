import { createUpdateSchema } from 'drizzle-zod'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('courseTypes.update')

	const database = useDatabase()

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		courseType: idSchema,
	}).parseAsync(data))

	const body = await readValidatedBody(event, async (data) =>
		await createUpdateSchema(courseTypes).omit({ id: true }).parseAsync(data))

	const result = await database
		.update(courseTypes)
		.set(body)
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
