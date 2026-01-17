import { createInsertSchema } from 'drizzle-zod'

export default defineEventHandler(async (event) => {
	await checkPermission('elections.create')

	const database = useDatabase()

	const body = await readValidatedBody(event, async (data) =>
		await createInsertSchema(elections).omit({ id: true }).parseAsync(data))

	return await database
		.insert(elections)
		.values(body)
		.returning({ id: elections.id })
})
