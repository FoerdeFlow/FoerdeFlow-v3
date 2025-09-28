import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('persons.delete')

	const database = useDatabase()

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		person: idSchema,
	}).parseAsync(data))

	const result = await database
		.delete(persons)
		.where(eq(persons.id, params.person))

	if(result.rowCount === 0) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Person nicht gefunden',
			data: {
				personId: params.person,
			},
		})
	}
})
