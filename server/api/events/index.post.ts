import { createInsertSchema } from 'drizzle-zod'
import z from 'zod'

export default defineEventHandler(async (event) => {
	const eventSchema = createInsertSchema(events).omit({ id: true })
	const body = await readValidatedBody(event, async (body) =>
		await eventSchema.parseAsync(
			await z.looseObject({
				startDate: z.coerce.date(),
				endDate: z.coerce.date().nullish(),
			}).parseAsync(body),
		),
	)

	await checkPermission('events.create', { organizationItem: body.organizationItem })

	const database = useDatabase()

	await checkLocationChoice(database, body, body.organizationItem)

	const [ result = null ] = await database
		.insert(events)
		.values(normalizeEventDates(body))
		.returning({ id: events.id })

	if(result === null) {
		throw createError({
			statusCode: 500,
			statusMessage: 'Veranstaltung konnte nicht erstellt werden',
		})
	}

	return result
})
