import { createInsertSchema } from 'drizzle-zod'

export default defineEventHandler(async (event) => {
	await checkPermission('roles.create')

	const database = useDatabase()

	const body = await readValidatedBody(event, async (data) =>
		await createInsertSchema(roles).omit({ id: true }).parseAsync(data))

	return await database
		.insert(roles)
		.values(body)
		.returning({ id: roles.id })
})
