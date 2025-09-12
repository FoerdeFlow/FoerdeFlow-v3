import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const database = useDatabase()

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		role: idSchema,
	}).parseAsync(data))

	const result = await database
		.delete(roles)
		.where(eq(roles.id, params.role))

	if(result.rowCount === 0) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Rolle nicht gefunden',
			data: {
				roleId: params.role,
			},
		})
	}
})
