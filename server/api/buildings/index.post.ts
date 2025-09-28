import { createInsertSchema } from 'drizzle-zod'

export default defineEventHandler(async (event) => {
	await checkPermission('buildings.create')

	const database = useDatabase()

	const body = await readValidatedBody(event, async (data) =>
		await createInsertSchema(buildings).omit({ id: true }).parseAsync(data))

	return await database
		.insert(buildings)
		.values(body)
		.returning({ id: buildings.id })
})
