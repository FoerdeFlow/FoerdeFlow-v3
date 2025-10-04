import { eq } from 'drizzle-orm'
import { createInsertSchema } from 'drizzle-zod'

export default defineEventHandler(async (event) => {
	const body = await readValidatedBody(event, async (data) =>
		await createInsertSchema(sessionAttendances).omit({ id: true }).parseAsync(data))

	const database = useDatabase()

	const session = await database.query.sessions.findFirst({
		where: eq(sessions.id, body.session),
		columns: {
			organizationItem: true,
		},
	})

	await checkPermission('attendances.create', { organizationItem: session?.organizationItem })

	return await database
		.insert(sessionAttendances)
		.values(body)
		.returning({ id: sessionAttendances.id })
})
