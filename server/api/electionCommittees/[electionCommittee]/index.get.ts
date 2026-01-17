import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('electionCommittees.read')

	const database = useDatabase()

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		electionCommittee: idSchema,
	}).parseAsync(data))

	const electionCommittee = await database.query.electionCommittees.findFirst({
		where: eq(electionCommittees.id, params.electionCommittee),
		with: {
			committee: true,
		},
		columns: {
			election: false,
			committee: false,
		},
	})

	if(!electionCommittee) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Wahlgremium nicht gefunden',
			data: {
				electionCommitteeId: params.electionCommittee,
			},
		})
	}

	return electionCommittee
})
