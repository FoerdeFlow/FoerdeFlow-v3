import { createInsertSchema } from 'drizzle-zod'

export default defineEventHandler(async (event) => {
	await checkPermission('announcements.create')

	const database = useDatabase()

	const body = await readValidatedBody(event, async (data) =>
		await createInsertSchema(announcements).omit({ id: true }).parseAsync(data))

	return await database
		.insert(announcements)
		.values(body)
		.returning({ id: announcements.id })
})
