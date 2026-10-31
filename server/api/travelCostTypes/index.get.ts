import type { EventContext } from '~~/server/types'

export default defineEventHandler(async (event) => {
	// Every user may read the list, the forms of the processes offer it.
	if(!(event.context as EventContext).user) {
		throw createError({
			statusCode: 401,
			statusMessage: 'Unauthorized',
			data: 'User is not authenticated',
		})
	}

	const database = useDatabase()

	const result = await database.query.travelCostTypes.findMany({
		orderBy: (items, { asc }) => [ asc(items.code) ],
	})

	return result
})
