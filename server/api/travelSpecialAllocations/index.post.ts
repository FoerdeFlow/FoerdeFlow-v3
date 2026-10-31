import { createInsertSchema } from 'drizzle-zod'

export default defineEventHandler(async (event) => {
	await checkPermission('travelSpecialAllocations.create')

	const database = useDatabase()

	const body = await readValidatedBody(event, async (data) =>
		await createInsertSchema(travelSpecialAllocations).omit({ id: true }).parseAsync(data))

	return await database
		.insert(travelSpecialAllocations)
		.values(body)
		.returning({ id: travelSpecialAllocations.id })
})
