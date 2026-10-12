import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		vehicleDriver: idSchema,
	}).parseAsync(data))

	await checkPermission('vehicleDrivers.update')

	const database = useDatabase()

	const result = await database
		.delete(vehicleDriverQualifications)
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
