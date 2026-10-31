import { eq } from 'drizzle-orm'
import { createUpdateSchema } from 'drizzle-zod'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('travelTransportModes.update')

	const database = useDatabase()

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		travelTransportMode: idSchema,
	}).parseAsync(data))

	const body = await readValidatedBody(event, async (data) =>
		await createUpdateSchema(travelTransportModes).omit({ id: true }).parseAsync(data))

	const result = await database
		.update(travelTransportModes)
		.set(body)
		.where(eq(travelTransportModes.id, params.travelTransportMode))

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
