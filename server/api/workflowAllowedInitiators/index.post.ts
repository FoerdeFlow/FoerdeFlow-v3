import { createInsertSchema } from 'drizzle-zod'

export default defineEventHandler(async (event) => {
	await checkPermission('workflowAllowedInitiators.create')

	const body = await readValidatedBody(event, async (data) =>
		await createInsertSchema(workflowAllowedInitiators).omit({ id: true }).parseAsync(data))

	const database = useDatabase()

	return await database
		.insert(workflowAllowedInitiators)
		.values(body)
		.returning({ id: workflowAllowedInitiators.id })
})
