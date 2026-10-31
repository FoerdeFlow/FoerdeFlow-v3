import { inArray } from 'drizzle-orm'

const travelTables = [ 'travelPermits', 'travelAdvances', 'travelClaims' ] as const

/**
 * Lists the workflows that grant permits, advances and claims for official
 * journeys, with the meta data that tells which journeys each one is for.
 * Whether the user may start them is up to the list of their own workflows.
 */
export default defineEventHandler(async (event) => {
	requireTravelPerson(event)

	const mutations = await useDatabase().query.workflowMutations.findMany({
		where: inArray(workflowMutations.table, [ ...travelTables ]),
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
		columns: {
			table: true,
			meta: true,
		},
	})

	const of = (table: typeof travelTables[number]) => mutations
		.filter((mutation) => mutation.table === table)
		.map((mutation) => ({ ...mutation.workflow, meta: mutation.meta }))

	return {
		permits: of('travelPermits'),
		advances: of('travelAdvances'),
		claims: of('travelClaims'),
	}
})
