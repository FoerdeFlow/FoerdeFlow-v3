import { createUpdateSchema } from 'drizzle-zod'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const database = useDatabase()

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		building: idSchema,
	}).parseAsync(data))

	const body = await readValidatedBody(event, async (data) =>
		await createUpdateSchema(buildings).omit({ id: true }).parseAsync(data))

	const result = await database
		.update(buildings)
		.set(body)
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
