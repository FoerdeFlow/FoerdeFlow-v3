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
		await createUpdateSchema(travelTransportReasons).omit({ id: true }).extend({
			transportModes: z.array(idSchema).min(1).optional(),
			roles: z.array(idSchema).optional(),
		}).parseAsync(data))

	const { transportModes, roles, ...reason } = body

	await database.transaction(async (tx) => {
		const result = await tx
			.update(travelTransportReasons)
			.set(reason)
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

		await writeTravelTransportReasonLinks(tx, params.travelTransportReason, { transportModes, roles })
	})
})
