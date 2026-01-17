import { createUpdateSchema } from 'drizzle-zod'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('electionProposals.update')

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		electionProposal: idSchema,
	}).parseAsync(data))

	const body = await readValidatedBody(event, async (data) =>
		await createUpdateSchema(electionProposals).omit({ id: true }).parseAsync(data))

	const database = useDatabase()

	const result = await database
		.update(electionProposals)
		.set(body)
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
