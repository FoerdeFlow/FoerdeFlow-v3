import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('electionProposals.delete')

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		electionProposal: idSchema,
	}).parseAsync(data))

	const database = useDatabase()

	const result = await database
		.delete(electionProposals)
		.where(eq(electionProposals.id, params.electionProposal))

	if(result.rowCount === 0) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Wahlvorschlag nicht gefunden',
			data: {
				electionProposalId: params.electionProposal,
			},
		})
	}
})
