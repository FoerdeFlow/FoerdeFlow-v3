import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('travelTransportModes.read')

	const database = useDatabase()

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		travelTransportMode: idSchema,
	}).parseAsync(data))

	const item = await database.query.travelTransportModes.findFirst({
		where: eq(travelTransportModes.id, params.travelTransportMode),
	})

	if(!item) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Verkehrsmittel nicht gefunden',
			data: {
				travelTransportModeId: params.travelTransportMode,
			},
		})
	}

	return item
})
