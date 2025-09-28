import { createInsertSchema } from 'drizzle-zod'

export default defineEventHandler(async (event) => {
	await checkPermission('roleOccupants.create')

	const database = useDatabase()

	const body = await readValidatedBody(event, async (data) =>
		await createInsertSchema(roleOccupants).omit({ id: true }).parseAsync(data))

	return await database
		.insert(roleOccupants)
		.values(body)
		.returning({ id: roleOccupants.id })
})
