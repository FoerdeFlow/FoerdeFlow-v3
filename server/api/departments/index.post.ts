import { createInsertSchema } from 'drizzle-zod'

export default defineEventHandler(async (event) => {
	await checkPermission('departments.create')

	const database = useDatabase()

	const body = await readValidatedBody(event, async (data) =>
		await createInsertSchema(departments).omit({ id: true }).parseAsync(data))

	return await database
		.insert(departments)
		.values(body)
		.returning({ id: departments.id })
})
