import { createInsertSchema } from 'drizzle-zod'

export default defineEventHandler(async (event) => {
	await checkPermission('eventTypes.create')

	const database = useDatabase()

	const body = await readValidatedBody(event, async (data) =>
		await createInsertSchema(eventTypes).omit({ id: true }).parseAsync(data))

	return await database
		.insert(eventTypes)
		.values(body)
		.returning({ id: eventTypes.id })
})
