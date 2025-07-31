import { createInsertSchema } from 'drizzle-zod'

export default defineEventHandler(async (event) => {
	const database = useDatabase()

	const body = await readValidatedBody(event, createInsertSchema(organizationTypes).omit({ id: true }).parseAsync)

	return await database
		.insert(organizationTypes)
		.values(body)
		.returning({ id: organizationTypes.id })
})