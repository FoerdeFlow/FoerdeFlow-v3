import { eq } from 'drizzle-orm'
import { createUpdateSchema } from 'drizzle-zod'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('travelCostTypes.update')

	const database = useDatabase()

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		travelCostType: idSchema,
	}).parseAsync(data))

	const body = await readValidatedBody(event, async (data) =>
		await createUpdateSchema(travelCostTypes).omit({ id: true }).parseAsync(data))

	const result = await database
		.update(travelCostTypes)
		.set(body)
		.where(eq(travelCostTypes.id, params.travelCostType))

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
