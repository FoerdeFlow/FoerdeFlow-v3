import type { EventContext } from '~~/server/types'

import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	// Every user may read the list, the forms of the processes offer it.
	if(!(event.context as EventContext).user) {
		throw createError({
			statusCode: 401,
			statusMessage: 'Unauthorized',
			data: 'User is not authenticated',
		})
	}

	const query = await getValidatedQuery(event, async (data) => await z.object({
		transportMode: idSchema.optional(),
	}).parseAsync(data))

	const database = useDatabase()

	const result = await database.query.travelTransportReasons.findMany({
		where: query.transportMode
			? eq(travelTransportReasons.transportMode, query.transportMode)
			: undefined,
		with: {
			transportMode: true,
		},
		columns: {
			transportMode: false,
		},
		orderBy: (reasons, { asc, sql }) => [
			asc(sql<string>`(
				SELECT code
				FROM ${travelTransportModes} ff3_ttm
				WHERE ff3_ttm.id = ${reasons.transportMode}
			)`),
			asc(reasons.code),
		],
	})

	return result
})
