import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('elections.delete')

	const database = useDatabase()

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		election: idSchema,
	}).parseAsync(data))

	const result = await database
		.delete(elections)
		.where(eq(elections.id, params.election))

	if(result.rowCount === 0) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Wahl nicht gefunden',
			data: {
				electionId: params.election,
			},
		})
	}
})
