import { createInsertSchema } from 'drizzle-zod'

export default defineEventHandler(async (event) => {
	await checkPermission('budgets.create')

	const database = useDatabase()

	const body = await readValidatedBody(event, async (data) =>
		await createInsertSchema(budgets).omit({ id: true }).parseAsync(data))

	return await database
		.insert(budgets)
		.values(body)
		.returning({ id: budgets.id })
})
