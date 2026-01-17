import { createInsertSchema } from 'drizzle-zod'

export default defineEventHandler(async (event) => {
	await checkPermission('courses.create')

	const database = useDatabase()

	const body = await readValidatedBody(event, async (data) =>
		await createInsertSchema(courses).omit({ id: true }).parseAsync(data))

	return await database
		.insert(courses)
		.values(body)
		.returning({ id: courses.id })
})
