import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('calendarTokens.read')

	const database = useDatabase()

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		calendarToken: idSchema,
	}).parseAsync(data))

	const calendarToken = await database.query.calendarTokens.findFirst({
		where: eq(calendarTokens.id, params.calendarToken),
	})

	if(!calendarToken) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Kalender-Abo nicht gefunden',
			data: {
				calendarTokenId: params.calendarToken,
			},
		})
	}

	return calendarToken
})
