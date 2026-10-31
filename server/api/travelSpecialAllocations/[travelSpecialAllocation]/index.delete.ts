import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('travelSpecialAllocations.delete')

	const database = useDatabase()

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		travelSpecialAllocation: idSchema,
	}).parseAsync(data))

	const result = await database
		.delete(travelSpecialAllocations)
		.where(eq(travelSpecialAllocations.id, params.travelSpecialAllocation))
		.catch((error: unknown) => {
			if(isForeignKeyViolation(error)) {
				throw createError({
					statusCode: 409,
					statusMessage: 'Der Eintrag wird noch verwendet und kann nicht gelöscht werden',
					data: {
						travelSpecialAllocationId: params.travelSpecialAllocation,
					},
				})
			}
			throw error
		})

	if(result.rowCount === 0) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Sonderzuweisung nicht gefunden',
			data: {
				travelSpecialAllocationId: params.travelSpecialAllocation,
			},
		})
	}
})
