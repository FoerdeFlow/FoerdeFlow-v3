import { createInsertSchema } from 'drizzle-zod'

export default defineEventHandler(async (event) => {
	const database = useDatabase()

	const body = await readValidatedBody(event, createInsertSchema(membershipTypes).omit({ id: true }).parseAsync)

	return await database
		.insert(membershipTypes)
		.values(body)
		.returning({ id: membershipTypes.id })
})