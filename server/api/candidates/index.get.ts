import z from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('candidates.read')

	const query = await getValidatedQuery(event, async (data) => await z.object({
		electionProposal: z.uuid(),
	}).parseAsync(data))

	const database = useDatabase()

	const candidates = await database.query.candidates.findMany({
		where: (candidates, { eq }) => eq(candidates.electionProposal, query.electionProposal),
		with: {
			candidate: {
				with: {
					course: true,
				},
				columns: {
					course: false,
				},
			},
		},
		columns: {
			electionProposal: false,
			candidate: false,
		},
	})

	return candidates
})
