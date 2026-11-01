import type { EventContext } from '~~/server/types'

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
		with: travelTransportReasonLinksWith,
		orderBy: (reasons, { asc }) => [ asc(reasons.code) ],
	})

	return result
		.map(withTravelTransportReasonLinks)
		.filter((reason) => !query.transportMode ||
			reason.transportModes.some((mode) => mode.id === query.transportMode))
})
