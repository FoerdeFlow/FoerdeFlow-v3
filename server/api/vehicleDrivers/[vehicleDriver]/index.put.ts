import { eq } from 'drizzle-orm'
import { createUpdateSchema } from 'drizzle-zod'
import z from 'zod'

export default defineEventHandler(async (event) => {
	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		vehicleDriver: idSchema,
	}).parseAsync(data))

	const body = await readValidatedBody(event, async (data) => await z.strictObject({
		...createUpdateSchema(vehicleDriverQualifications).omit({ id: true, person: true }).shape,
	}).parseAsync(data))

	await checkPermission('vehicleDrivers.update')

	const database = useDatabase()

	const result = await database
		.update(vehicleDriverQualifications)
		.set(body)
		.where(eq(vehicleDriverQualifications.id, params.vehicleDriver))

	if(result.rowCount === 0) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Fahrberechtigung nicht gefunden',
			data: {
				vehicleDriverId: params.vehicleDriver,
			},
		})
	}
})
