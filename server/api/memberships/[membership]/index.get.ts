import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const database = useDatabase()

	const params = await getValidatedRouterParams(event, z.object({
		membership: idSchema,
	}).parseAsync)

	const membership = await database.query.memberships.findFirst({
		where: eq(memberships.id, params.membership),
	})

	if(!membership) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Mitgliedschaft nicht gefunden',
			data: {
				membershipId: params.membership,
			},
		})
	}

	return membership
})