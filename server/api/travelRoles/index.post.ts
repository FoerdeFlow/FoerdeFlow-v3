import { createInsertSchema } from 'drizzle-zod'

export default defineEventHandler(async (event) => {
	await checkPermission('travelRoles.create')

	const database = useDatabase()

	const body = await readValidatedBody(event, async (data) =>
		await createInsertSchema(travelRoles).omit({ id: true }).parseAsync(data))

	return await database
		.insert(travelRoles)
		.values(body)
		.returning({ id: travelRoles.id })
})
