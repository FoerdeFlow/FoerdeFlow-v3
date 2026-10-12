import type { EventContext } from '~~/server/types'

import { eq } from 'drizzle-orm'

/**
 * Lists the workflows a claim for the costs of an official journey is made
 * in, so that a permit can point the way to them.
 */
export default defineEventHandler(async (event) => {
	if(!(event.context as EventContext).user) {
		throw createError({
			statusCode: 401,
			statusMessage: 'Unauthorized',
		})
	}

	const database = useDatabase()

	const mutations = await database.query.workflowMutations.findMany({
		where: eq(workflowMutations.table, 'travelClaims'),
		with: {
			workflow: {
				columns: {
					id: true,
					code: true,
					name: true,
					description: true,
				},
			},
		},
		columns: {},
	})

	return mutations.map((mutation) => mutation.workflow)
})
