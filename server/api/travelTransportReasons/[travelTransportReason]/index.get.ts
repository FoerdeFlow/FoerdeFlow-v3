import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('travelTransportReasons.read')

	const database = useDatabase()

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		travelTransportReason: idSchema,
	}).parseAsync(data))

	const item = await database.query.travelTransportReasons.findFirst({
		where: eq(travelTransportReasons.id, params.travelTransportReason),
		with: {
			transportMode: true,
		},
		columns: {
			transportMode: false,
		},
	})

	if(!item) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Grund für die Wahl des Verkehrsmittels nicht gefunden',
			data: {
				travelTransportReasonId: params.travelTransportReason,
			},
		})
	}

	return item
})
