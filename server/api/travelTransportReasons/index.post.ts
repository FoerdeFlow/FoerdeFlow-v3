import { createInsertSchema } from 'drizzle-zod'

export default defineEventHandler(async (event) => {
	await checkPermission('travelTransportReasons.create')

	const database = useDatabase()

	const body = await readValidatedBody(event, async (data) =>
		await createInsertSchema(travelTransportReasons).omit({ id: true }).parseAsync(data))

	return await database
		.insert(travelTransportReasons)
		.values(body)
		.returning({ id: travelTransportReasons.id })
})
