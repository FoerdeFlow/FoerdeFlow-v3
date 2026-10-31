import { createInsertSchema } from 'drizzle-zod'

export default defineEventHandler(async (event) => {
	await checkPermission('travelTransportModes.create')

	const database = useDatabase()

	const body = await readValidatedBody(event, async (data) =>
		await createInsertSchema(travelTransportModes).omit({ id: true }).parseAsync(data))

	return await database
		.insert(travelTransportModes)
		.values(body)
		.returning({ id: travelTransportModes.id })
})
