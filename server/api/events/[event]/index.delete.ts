import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		event: idSchema,
	}).parseAsync(data))

	const database = useDatabase()

	const existing = await database.query.events.findFirst({
		where: eq(events.id, params.event),
		columns: {
			organizationItem: true,
		},
	})

	await checkPermission('events.delete', { organizationItem: existing?.organizationItem })

	const result = await database
		.delete(events)
		.where(eq(events.id, params.event))

	if(result.rowCount === 0) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Veranstaltung nicht gefunden',
			data: {
				eventId: params.event,
			},
		})
	}
})
