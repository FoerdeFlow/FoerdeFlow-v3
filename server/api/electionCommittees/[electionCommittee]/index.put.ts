import { createUpdateSchema } from 'drizzle-zod'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('electionCommittees.update')

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		electionCommittee: idSchema,
	}).parseAsync(data))

	const body = await readValidatedBody(event, async (data) =>
		await createUpdateSchema(electionCommittees).omit({ id: true }).parseAsync(data))

	const database = useDatabase()

	const result = await database
		.update(electionCommittees)
		.set(body)
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
