import { createInsertSchema } from 'drizzle-zod'
import { randomBytes } from 'node:crypto'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('calendarTokens.create')

	const database = useDatabase()

	// Der Token wird nur hier erzeugt, nie aus dem Rumpf übernommen; ein
	// mitgeschicktes `token` weist `strictObject` ab.
	const calendarTokenSchema = createInsertSchema(calendarTokens)
	const body = await readValidatedBody(event, async (data) => await z.strictObject({
		name: calendarTokenSchema.shape.name,
		...calendarTokenFilterSchema,
	}).parseAsync(data))

	return await database.transaction(async (tx) => {
		const [ result = null ] = await tx
			.insert(calendarTokens)
			.values({
				name: body.name,
				token: randomBytes(32).toString('base64url'),
			})
			.returning({ id: calendarTokens.id, token: calendarTokens.token })

		if(result === null) {
			throw createError({
				statusCode: 500,
				statusMessage: 'Kalender-Abo konnte nicht erstellt werden',
			})
		}

		await writeCalendarTokenFilters(tx, result.id, body)

		return result
	})
})
