import { createInsertSchema } from 'drizzle-zod'

export default defineEventHandler(async (event) => {
	await checkPermission('attendances.create')

	const database = useDatabase()

	const body = await readValidatedBody(event, async (data) =>
		await createInsertSchema(sessionAttendances).omit({ id: true }).parseAsync(data))

	return await database
		.insert(sessionAttendances)
		.values(body)
		.returning({ id: sessionAttendances.id })
})
