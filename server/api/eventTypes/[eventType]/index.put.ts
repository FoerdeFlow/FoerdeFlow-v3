import { eq } from 'drizzle-orm'
import { createUpdateSchema } from 'drizzle-zod'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('eventTypes.update')

	const database = useDatabase()

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		eventType: idSchema,
	}).parseAsync(data))

	const body = await readValidatedBody(event, async (data) =>
		await createUpdateSchema(eventTypes).omit({ id: true }).parseAsync(data))

	const result = await database
		.update(eventTypes)
		.set(body)
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
