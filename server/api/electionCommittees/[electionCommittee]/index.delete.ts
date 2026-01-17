import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('electionCommittees.delete')

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		electionCommittee: idSchema,
	}).parseAsync(data))

	const database = useDatabase()

	const result = await database
		.delete(electionCommittees)
		.where(eq(electionCommittees.id, params.electionCommittee))

	if(result.rowCount === 0) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Wahlgremium nicht gefunden',
			data: {
				electionCommitteeId: params.electionCommittee,
			},
		})
	}
})
