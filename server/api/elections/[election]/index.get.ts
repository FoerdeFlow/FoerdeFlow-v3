import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('elections.read')

	const database = useDatabase()

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		election: idSchema,
	}).parseAsync(data))

	const election = await database.query.elections.findFirst({
		where: eq(elections.id, params.election),
	})

	if(!election) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Wahl nicht gefunden',
			data: {
				electionId: params.election,
			},
		})
	}

	return election
})
