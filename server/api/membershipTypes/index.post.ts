import { createInsertSchema } from 'drizzle-zod'

export default defineEventHandler(async (event) => {
	await checkPermission('membershipTypes.create')

	const database = useDatabase()

	const body = await readValidatedBody(event, async (data) =>
		await createInsertSchema(membershipTypes).omit({ id: true }).parseAsync(data))

	return await database
		.insert(membershipTypes)
		.values(body)
		.returning({ id: membershipTypes.id })
})
