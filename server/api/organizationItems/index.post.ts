import { createInsertSchema } from 'drizzle-zod'

export default defineEventHandler(async (event) => {
	const database = useDatabase()

	const body = await readValidatedBody(event, createInsertSchema(organizationItems).omit({ id: true }).parseAsync)

	return await database
		.insert(organizationItems)
		.values(body)
		.returning({ id: organizationItems.id })
})