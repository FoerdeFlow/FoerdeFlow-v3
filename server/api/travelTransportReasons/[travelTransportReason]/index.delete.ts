import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('travelTransportReasons.delete')

	const database = useDatabase()

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		travelTransportReason: idSchema,
	}).parseAsync(data))

	const result = await database
		.delete(travelTransportReasons)
		.where(eq(travelTransportReasons.id, params.travelTransportReason))
		.catch((error: unknown) => {
			if(isForeignKeyViolation(error)) {
				throw createError({
					statusCode: 409,
					statusMessage: 'Der Eintrag wird noch verwendet und kann nicht gelöscht werden',
					data: {
						travelTransportReasonId: params.travelTransportReason,
					},
				})
			}
			throw error
		})

	if(result.rowCount === 0) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Grund für die Wahl des Verkehrsmittels nicht gefunden',
			data: {
				travelTransportReasonId: params.travelTransportReason,
			},
		})
	}
})
