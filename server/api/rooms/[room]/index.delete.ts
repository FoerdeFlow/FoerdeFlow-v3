import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('rooms.delete')

	const database = useDatabase()

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		room: idSchema,
	}).parseAsync(data))

	const result = await database
		.delete(rooms)
		.where(eq(rooms.id, params.room))

	if(result.rowCount === 0) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Raum nicht gefunden',
			data: {
				roomId: params.room,
			},
		})
	}
})
