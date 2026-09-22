import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('calendarTokens.delete')

	const database = useDatabase()

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		calendarToken: idSchema,
	}).parseAsync(data))

	const result = await database
		.delete(calendarTokens)
		.where(eq(calendarTokens.id, params.calendarToken))

	if(result.rowCount === 0) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Kalender-Abo nicht gefunden',
			data: {
				calendarTokenId: params.calendarToken,
			},
		})
	}
})
