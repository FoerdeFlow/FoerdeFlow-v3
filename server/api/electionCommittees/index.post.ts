import { createInsertSchema } from 'drizzle-zod'

export default defineEventHandler(async (event) => {
	await checkPermission('electionCommittees.create')

	const database = useDatabase()

	const body = await readValidatedBody(event, async (data) =>
		await createInsertSchema(electionCommittees).omit({ id: true }).parseAsync(data))

	return await database
		.insert(electionCommittees)
		.values(body)
		.returning({ id: electionCommittees.id })
})
