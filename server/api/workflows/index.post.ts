import { createInsertSchema } from 'drizzle-zod'

export default defineEventHandler(async (event) => {
	await checkPermission('workflows.create')

	const database = useDatabase()

	const body = await readValidatedBody(event, async (data) =>
		await createInsertSchema(workflows).omit({ id: true }).parseAsync(data))

	return await database
		.insert(workflows)
		.values(body)
		.returning({ id: workflows.id })
})
