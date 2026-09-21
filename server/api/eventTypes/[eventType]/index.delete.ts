import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('eventTypes.delete')

	const database = useDatabase()

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		eventType: idSchema,
	}).parseAsync(data))

	const result = await database
		.delete(eventTypes)
		.where(eq(eventTypes.id, params.eventType))

	if(result.rowCount === 0) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Veranstaltungsart nicht gefunden',
			data: {
				eventTypeId: params.eventType,
			},
		})
	}
})
