import { createInsertSchema } from 'drizzle-zod'
import z from 'zod'

export default defineEventHandler(async (event) => {
	const body = await readValidatedBody(event, async (data) => await z.strictObject({
		...createInsertSchema(vehicleDriverQualifications).omit({ id: true }).shape,
	}).parseAsync(data))

	await checkPermission('vehicleDrivers.update')

	const database = useDatabase()

	const [ result ] = await database
		.insert(vehicleDriverQualifications)
		.values(body)
		.onConflictDoNothing()
		.returning({ id: vehicleDriverQualifications.id })

	if(!result) {
		throw createError({
			statusCode: 409,
			statusMessage: 'Für diese Person ist bereits eine Fahrberechtigung erfasst',
		})
	}

	return result
})
