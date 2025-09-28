import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('buildings.read')

	const database = useDatabase()

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		building: idSchema,
	}).parseAsync(data))

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
