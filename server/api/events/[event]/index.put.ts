import { eq } from 'drizzle-orm'
import { createUpdateSchema } from 'drizzle-zod'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		event: idSchema,
	}).parseAsync(data))

	const eventSchema = createUpdateSchema(events).omit({ id: true, organizationItem: true })
	const body = await readValidatedBody(event, async (body: unknown) => z.strictObject({
		...eventSchema.shape,
		startDate: z.coerce.date(),
		endDate: z.coerce.date().nullish().optional(),
	}).parseAsync(body))
	const updateBody = normalizeEventDates({
		endDate: null,
		...body,
	})

	const database = useDatabase()

	const existing = await database.query.events.findFirst({
		where: eq(events.id, params.event),
		columns: {
			organizationItem: true,
		},
	})

	await checkPermission('events.update', { organizationItem: existing?.organizationItem })

	if(existing) await checkLocationChoice(database, body, existing.organizationItem)

	const result = await database
		.update(events)
		.set(updateBody)
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
