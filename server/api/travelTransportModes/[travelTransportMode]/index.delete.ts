import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('travelTransportModes.delete')

	const database = useDatabase()

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		travelTransportMode: idSchema,
	}).parseAsync(data))

	const result = await database
		.delete(travelTransportModes)
		.where(eq(travelTransportModes.id, params.travelTransportMode))
		.catch((error: unknown) => {
			if(isForeignKeyViolation(error)) {
				throw createError({
					statusCode: 409,
					statusMessage: 'Der Eintrag wird noch verwendet und kann nicht gelöscht werden',
					data: {
						travelTransportModeId: params.travelTransportMode,
					},
				})
			}
			throw error
		})

	if(result.rowCount === 0) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Verkehrsmittel nicht gefunden',
			data: {
				travelTransportModeId: params.travelTransportMode,
			},
		})
	}
})
