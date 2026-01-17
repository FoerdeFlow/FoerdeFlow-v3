import { createUpdateSchema } from 'drizzle-zod'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('departments.update')

	const database = useDatabase()

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		department: idSchema,
	}).parseAsync(data))

	const body = await readValidatedBody(event, async (data) =>
		await createUpdateSchema(departments).omit({ id: true }).parseAsync(data))

	const result = await database
		.update(departments)
		.set(body)
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
