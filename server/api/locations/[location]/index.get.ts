import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('locations.read')

	const database = useDatabase()

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		location: idSchema,
	}).parseAsync(data))

	const location = await database.query.locations.findFirst({
		where: eq(locations.id, params.location),
		with: {
			parent: true,
		},
		columns: {
			parent: false,
		},
	})

	if(!location) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Ort nicht gefunden',
			data: {
				locationId: params.location,
			},
		})
	}

	return {
		...location,
		usage: await getLocationUsage(database, params.location),
	}
})
