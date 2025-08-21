import { createUpdateSchema } from 'drizzle-zod'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const database = useDatabase()

	const params = await getValidatedRouterParams(event, z.object({
		building: idSchema,
	}).parseAsync)

	const result = await database
		.delete(buildings)
		.where(eq(buildings.id, params.building))

	if(result.rowCount === 0) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Gebäude nicht gefunden',
			data: {
				buildingId: params.building,
			},
		})
	}
})
