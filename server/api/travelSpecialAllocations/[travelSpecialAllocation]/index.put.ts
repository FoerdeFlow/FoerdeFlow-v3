import { eq } from 'drizzle-orm'
import { createUpdateSchema } from 'drizzle-zod'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('travelSpecialAllocations.update')

	const database = useDatabase()

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		travelSpecialAllocation: idSchema,
	}).parseAsync(data))

	const body = await readValidatedBody(event, async (data) =>
		await createUpdateSchema(travelSpecialAllocations).omit({ id: true }).parseAsync(data))

	const result = await database
		.update(travelSpecialAllocations)
		.set(body)
		.where(eq(travelSpecialAllocations.id, params.travelSpecialAllocation))

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
