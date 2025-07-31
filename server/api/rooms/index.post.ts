import { createInsertSchema } from 'drizzle-zod'

export default defineEventHandler(async (event) => {
	const database = useDatabase()

	const body = await readValidatedBody(event, createInsertSchema(rooms).omit({ id: true }).parseAsync)

	return await database
		.insert(rooms)
		.values(body)
		.returning({ id: rooms.id })
})