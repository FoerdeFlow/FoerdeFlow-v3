import { createUpdateSchema } from 'drizzle-zod'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const database = useDatabase()

	const params = await getValidatedRouterParams(event, z.object({
		room: idSchema,
	}).parseAsync)

	const body = await readValidatedBody(event, createUpdateSchema(rooms).omit({ id: true }).parseAsync)

	const result = await database
		.update(rooms)
		.set(body)
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
