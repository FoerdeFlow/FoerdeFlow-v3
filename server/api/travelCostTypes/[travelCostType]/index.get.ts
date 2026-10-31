import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('travelCostTypes.read')

	const database = useDatabase()

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		travelCostType: idSchema,
	}).parseAsync(data))

	const item = await database.query.travelCostTypes.findFirst({
		where: eq(travelCostTypes.id, params.travelCostType),
	})

	if(!item) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Dienstreisekostenart nicht gefunden',
			data: {
				travelCostTypeId: params.travelCostType,
			},
		})
	}

	return item
})
