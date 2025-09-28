import { createUpdateSchema } from 'drizzle-zod'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('rooms.update')

	const database = useDatabase()

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		room: idSchema,
	}).parseAsync(data))

	const body = await readValidatedBody(event, async (data) =>
		await createUpdateSchema(rooms).omit({ id: true }).parseAsync(data))

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
