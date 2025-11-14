import { createInsertSchema } from 'drizzle-zod'

export default defineEventHandler(async (event) => {
	const body = await readValidatedBody(event, async (data) =>
		await createInsertSchema(documents).omit({ id: true }).parseAsync(data))

	await checkPermission('documents.create', { organizationItem: body.organizationItem })

	const database = useDatabase()

	return await database
		.insert(documents)
		.values(body)
		.returning({ id: documents.id })
})
