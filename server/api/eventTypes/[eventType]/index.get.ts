import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('eventTypes.read')

	const database = useDatabase()

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		eventType: idSchema,
	}).parseAsync(data))

	const eventType = await database.query.eventTypes.findFirst({
		where: eq(eventTypes.id, params.eventType),
	})

	if(!eventType) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Veranstaltungsart nicht gefunden',
			data: {
				eventTypeId: params.eventType,
			},
		})
	}

	return eventType
})
