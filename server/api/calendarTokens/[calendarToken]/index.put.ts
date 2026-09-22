import { eq } from 'drizzle-orm'
import { createUpdateSchema } from 'drizzle-zod'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('calendarTokens.update')

	const database = useDatabase()

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		calendarToken: idSchema,
	}).parseAsync(data))

	// Nur der Name lässt sich ändern; der Token selbst bleibt, wie er erzeugt
	// wurde. `strictObject` weist ein mitgeschicktes `token` ab, statt es
	// stillschweigend zu verwerfen.
	const calendarTokenSchema = createUpdateSchema(calendarTokens).required({ name: true })
	const body = await readValidatedBody(event, async (data) => await z.strictObject({
		name: calendarTokenSchema.shape.name,
	}).parseAsync(data))

	const result = await database
		.update(calendarTokens)
		.set(body)
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
