import { createInsertSchema } from 'drizzle-zod'

export default defineEventHandler(async (event) => {
	await checkPermission('courseTypes.create')

	const database = useDatabase()

	const body = await readValidatedBody(event, async (data) =>
		await createInsertSchema(courseTypes).omit({ id: true }).parseAsync(data))

	return await database
		.insert(courseTypes)
		.values(body)
		.returning({ id: courseTypes.id })
})
