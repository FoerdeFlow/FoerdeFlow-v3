import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const database = useDatabase()

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		event: idSchema,
	}).parseAsync(data))

	const result = await database.query.events.findFirst({
		where: eq(events.id, params.event),
		with: {
			organizationItem: true,
			type: true,
			location: {
				with: {
					parent: true,
				},
				columns: {
					parent: false,
				},
			},
			onlineLocation: {
				with: {
					parent: true,
				},
				columns: {
					parent: false,
				},
			},
		},
		columns: {
			organizationItem: false,
			type: false,
			location: false,
			onlineLocation: false,
		},
	})

	await checkPermission('events.read', { organizationItem: result?.organizationItem.id })

	if(!result) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Veranstaltung nicht gefunden',
			data: {
				eventId: params.event,
			},
		})
	}

	return result
})
