import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const database = useDatabase()

	const params = await getValidatedRouterParams(event, z.object({
		room: idSchema,
	}).parseAsync)

	const room = await database.query.rooms.findFirst({
		where: eq(rooms.id, params.room),
		with: {
			building: true,
		},
	})

	if(!room) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Raum nicht gefunden',
			data: {
				roomId: params.room,
			},
		})
	}

	return room
})