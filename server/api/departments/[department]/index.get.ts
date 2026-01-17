import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('departments.read')

	const database = useDatabase()

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		department: idSchema,
	}).parseAsync(data))

	const department = await database.query.departments.findFirst({
		where: eq(departments.id, params.department),
	})

	if(!department) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Fachbereich nicht gefunden',
			data: {
				departmentId: params.department,
			},
		})
	}

	return department
})
