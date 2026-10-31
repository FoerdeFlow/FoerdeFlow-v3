import { createInsertSchema } from 'drizzle-zod'

export default defineEventHandler(async (event) => {
	await checkPermission('travelCostTypes.create')

	const database = useDatabase()

	const body = await readValidatedBody(event, async (data) =>
		await createInsertSchema(travelCostTypes).omit({ id: true }).parseAsync(data))

	return await database
		.insert(travelCostTypes)
		.values(body)
		.returning({ id: travelCostTypes.id })
})
