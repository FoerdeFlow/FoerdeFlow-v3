import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('electionProposals.read')

	const database = useDatabase()

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		electionProposal: idSchema,
	}).parseAsync(data))

	const electionProposal = await database.query.electionProposals.findFirst({
		where: eq(electionProposals.id, params.electionProposal),
		with: {
			submitter: {
				with: {
					course: true,
				},
				columns: {
					id: true,
					firstName: true,
					lastName: true,
					callName: true,
					gender: true,
					pronouns: true,
				},
			},
		},
		columns: {
			id: false,
			electionCommittee: true,
			submitter: false,
		},
	})

	if(!electionProposal) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Wahlvorschlag nicht gefunden',
			data: {
				electionProposalId: params.electionProposal,
			},
		})
	}

	return electionProposal
})
