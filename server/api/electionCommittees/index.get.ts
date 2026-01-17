import z from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('electionCommittees.read')

	const query = await getValidatedQuery(event, async (data) => await z.object({
		election: z.uuid(),
	}).parseAsync(data))

	const database = useDatabase()

	const electionCommittees = await database.query.electionCommittees.findMany({
		where: (electionCommittees, { eq }) => eq(electionCommittees.election, query.election),
		with: {
			committee: true,
		},
		columns: {
			election: false,
			committee: false,
		},
	})

	return electionCommittees
})
