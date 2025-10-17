import { createInsertSchema } from 'drizzle-zod'

export default defineEventHandler(async (event) => {
	await checkPermission('workflowMutations.create')

	const body = await readValidatedBody(event, async (data) =>
		await createInsertSchema(workflowMutations).omit({ id: true }).parseAsync(data))

	const database = useDatabase()

	return await database
		.insert(workflowMutations)
		.values(body)
		.returning({ id: workflowMutations.id })
})
