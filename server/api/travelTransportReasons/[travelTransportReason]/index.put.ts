import { eq } from 'drizzle-orm'
import { createUpdateSchema } from 'drizzle-zod'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('travelTransportReasons.update')

	const database = useDatabase()

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		travelTransportReason: idSchema,
	}).parseAsync(data))

	const body = await readValidatedBody(event, async (data) =>
		await createUpdateSchema(travelTransportReasons).omit({ id: true }).parseAsync(data))

	const result = await database
		.update(travelTransportReasons)
		.set(body)
		.where(eq(travelTransportReasons.id, params.travelTransportReason))

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
