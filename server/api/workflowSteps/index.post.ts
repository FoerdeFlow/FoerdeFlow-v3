import { createInsertSchema } from 'drizzle-zod'

export default defineEventHandler(async (event) => {
	await checkPermission('workflowSteps.create')

	const body = await readValidatedBody(event, async (data) =>
		await createInsertSchema(workflowSteps).omit({ id: true }).parseAsync(data))

	const database = useDatabase()

	return await database
		.insert(workflowSteps)
		.values(body)
		.returning({ id: workflowSteps.id })
})
