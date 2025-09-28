import { createInsertSchema } from 'drizzle-zod'

export default defineEventHandler(async (event) => {
	await checkPermission('rolePermissions.create')

	const database = useDatabase()

	const body = await readValidatedBody(event, async (data) =>
		await createInsertSchema(rolePermissions).omit({ id: true }).parseAsync(data))

	return await database
		.insert(rolePermissions)
		.values(body)
		.returning({ id: rolePermissions.id })
})
