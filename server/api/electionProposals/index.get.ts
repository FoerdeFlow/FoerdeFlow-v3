import z from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('electionProposals.read')

	const query = await getValidatedQuery(event, async (data) => await z.object({
		electionCommittee: z.uuid(),
	}).parseAsync(data))

	const database = useDatabase()

	const electionProposals = await database.query.electionProposals.findMany({
		where: (electionProposals, { eq }) => eq(electionProposals.electionCommittee, query.electionCommittee),
		with: {
			submitter: {
				with: {
					course: true,
				},
				columns: {
					course: false,
				},
			},
		},
		columns: {
			electionCommittee: false,
			submitter: false,
		},
	})

	return electionProposals
})
