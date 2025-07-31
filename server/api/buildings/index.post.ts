import { createInsertSchema } from 'drizzle-zod'

export default defineEventHandler(async (event) => {
	const database = useDatabase()

	const body = await readValidatedBody(event, createInsertSchema(buildings).omit({ id: true }).parseAsync)

	return await database
		.insert(buildings)
		.values(body)
		.returning({ id: buildings.id })
})