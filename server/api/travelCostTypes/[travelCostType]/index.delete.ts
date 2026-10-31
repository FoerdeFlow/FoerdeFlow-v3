import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('travelCostTypes.delete')

	const database = useDatabase()

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		travelCostType: idSchema,
	}).parseAsync(data))

	const result = await database
		.delete(travelCostTypes)
		.where(eq(travelCostTypes.id, params.travelCostType))
		.catch((error: unknown) => {
			if(isForeignKeyViolation(error)) {
				throw createError({
					statusCode: 409,
					statusMessage: 'Der Eintrag wird noch verwendet und kann nicht gelöscht werden',
					data: {
						travelCostTypeId: params.travelCostType,
					},
				})
			}
			throw error
		})

	if(result.rowCount === 0) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Dienstreisekostenart nicht gefunden',
			data: {
				travelCostTypeId: params.travelCostType,
			},
		})
	}
})
