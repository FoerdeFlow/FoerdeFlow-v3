import { createInsertSchema } from 'drizzle-zod'

export default defineEventHandler(async (event) => {
	const database = useDatabase()

	const body = await readValidatedBody(event, createInsertSchema(persons).omit({ id: true }).parseAsync)

	return await database
		.insert(persons)
		.values(body)
		.returning({ id: persons.id })
})