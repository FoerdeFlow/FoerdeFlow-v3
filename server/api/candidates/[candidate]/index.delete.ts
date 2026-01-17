import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('candidates.delete')

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		candidate: idSchema,
	}).parseAsync(data))

	const database = useDatabase()

	const result = await database
		.delete(candidates)
		.where(eq(candidates.id, params.candidate))

	if(result.rowCount === 0) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Kandidat*in nicht gefunden',
			data: {
				candidateId: params.candidate,
			},
		})
	}
})
