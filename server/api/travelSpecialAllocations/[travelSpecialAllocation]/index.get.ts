import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('travelSpecialAllocations.read')

	const database = useDatabase()

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		travelSpecialAllocation: idSchema,
	}).parseAsync(data))

	const item = await database.query.travelSpecialAllocations.findFirst({
		where: eq(travelSpecialAllocations.id, params.travelSpecialAllocation),
		with: {
			budget: {
				with: {
					organizationItem: true,
				},
				columns: {
					organizationItem: false,
				},
			},
		},
		columns: {
			budget: false,
		},
	})

	if(!item) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Sonderzuweisung nicht gefunden',
			data: {
				travelSpecialAllocationId: params.travelSpecialAllocation,
			},
		})
	}

	return item
})
