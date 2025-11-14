import { createInsertSchema } from 'drizzle-zod'

export default defineEventHandler(async (event) => {
	await checkPermission('documentTypes.create')

	const database = useDatabase()

	const body = await readValidatedBody(event, async (data) =>
		await createInsertSchema(documentTypes).omit({ id: true }).parseAsync(data))

	return await database
		.insert(documentTypes)
		.values(body)
		.returning({ id: documentTypes.id })
})
