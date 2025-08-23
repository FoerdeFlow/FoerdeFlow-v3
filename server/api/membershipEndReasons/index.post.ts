import { createInsertSchema } from 'drizzle-zod'

export default defineEventHandler(async (event) => {
	const database = useDatabase()

	const body = await readValidatedBody(event, async (data) =>
		await createInsertSchema(membershipEndReasons).omit({ id: true }).parseAsync(data))

	return await database
		.insert(membershipEndReasons)
		.values(body)
		.returning({ id: membershipEndReasons.id })
})
