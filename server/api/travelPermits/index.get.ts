import type { EventContext } from '~~/server/types'

export default defineEventHandler(async (event) => {
	if(!(event.context as EventContext).user) {
		throw createError({
			statusCode: 401,
			statusMessage: 'Unauthorized',
		})
	}

	return await readTravelPermits()
})
