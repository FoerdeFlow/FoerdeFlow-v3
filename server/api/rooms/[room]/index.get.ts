import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('rooms.read')

	const database = useDatabase()

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		room: idSchema,
	}).parseAsync(data))

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
