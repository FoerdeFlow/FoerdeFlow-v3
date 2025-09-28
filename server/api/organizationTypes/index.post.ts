import { createInsertSchema } from 'drizzle-zod'

export default defineEventHandler(async (event) => {
	await checkPermission('organizationTypes.create')

	const database = useDatabase()

	const body = await readValidatedBody(event, async (data) =>
		await createInsertSchema(organizationTypes).omit({ id: true }).parseAsync(data))

	return await database
		.insert(organizationTypes)
		.values(body)
		.returning({ id: organizationTypes.id })
})
