import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('departments.delete')

	const database = useDatabase()

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		department: idSchema,
	}).parseAsync(data))

	const result = await database
		.delete(departments)
		.where(eq(departments.id, params.department))

	if(result.rowCount === 0) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Fachbereich nicht gefunden',
			data: {
				departmentId: params.department,
			},
		})
	}
})
