import { createInsertSchema } from 'drizzle-zod'

export default defineEventHandler(async (event) => {
	await checkPermission('councils.create')

	const database = useDatabase()

	const body = await readValidatedBody(event, async (data) =>
		await createInsertSchema(councils).omit({ id: true }).parseAsync(data))

	return await database
		.insert(councils)
		.values(body)
		.returning({ id: councils.id })
})
