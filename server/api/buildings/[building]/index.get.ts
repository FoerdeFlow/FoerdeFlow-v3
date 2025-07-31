import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const database = useDatabase()

	const params = await getValidatedRouterParams(event, z.object({
		building: idSchema,
	}).parseAsync)

	const building = await database.query.buildings.findFirst({
		where: eq(buildings.id, params.building),
	})

	if(!building) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Gebäude nicht gefunden',
			data: {
				buildingId: params.building,
			},
		})
	}

	return building
})