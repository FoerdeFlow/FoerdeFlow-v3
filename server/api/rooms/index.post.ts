import { createInsertSchema } from 'drizzle-zod'

export default defineEventHandler(async (event) => {
	const database = useDatabase()

	const body = await readValidatedBody(event, async (data) =>
		await createInsertSchema(rooms).omit({ id: true }).parseAsync(data))

	return await database
		.insert(rooms)
		.values(body)
		.returning({ id: rooms.id })
})
