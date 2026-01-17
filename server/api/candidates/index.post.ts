import { createInsertSchema } from 'drizzle-zod'

export default defineEventHandler(async (event) => {
	await checkPermission('candidates.create')

	const database = useDatabase()

	const body = await readValidatedBody(event, async (data) =>
		await createInsertSchema(candidates).omit({ id: true }).parseAsync(data))

	return await database
		.insert(candidates)
		.values(body)
		.returning({ id: candidates.id })
})
