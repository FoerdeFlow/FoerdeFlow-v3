import { createInsertSchema } from 'drizzle-zod'

export default defineEventHandler(async (event) => {
	await checkPermission('electionProposals.create')

	const database = useDatabase()

	const body = await readValidatedBody(event, async (data) =>
		await createInsertSchema(electionProposals).omit({ id: true }).parseAsync(data))

	return await database
		.insert(electionProposals)
		.values(body)
		.returning({ id: electionProposals.id })
})
