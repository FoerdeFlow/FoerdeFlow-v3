import { eq } from 'drizzle-orm'
import { createUpdateSchema } from 'drizzle-zod'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('calendarTokens.update')

	const database = useDatabase()

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		calendarToken: idSchema,
	}).parseAsync(data))

	// Name und Filter lassen sich ändern; der Token selbst bleibt, wie er
	// erzeugt wurde. `strictObject` weist ein mitgeschicktes `token` ab, statt
	// es stillschweigend zu verwerfen.
	const calendarTokenSchema = createUpdateSchema(calendarTokens).required({ name: true })
	const body = await readValidatedBody(event, async (data) => await z.strictObject({
		name: calendarTokenSchema.shape.name,
		...calendarTokenFilterSchema,
	}).parseAsync(data))

	await database.transaction(async (tx) => {
		const result = await tx
			.update(calendarTokens)
			.set({ name: body.name })
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

		await writeCalendarTokenFilters(tx, params.calendarToken, body)
	})
})
