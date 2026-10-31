import type { SQL } from 'drizzle-orm'

import { asc, desc, eq } from 'drizzle-orm'

const personColumns = {
	id: true,
	firstName: true,
	lastName: true,
	callName: true,
	pronouns: true,
} as const

/**
 * Reads permits for official journeys with everything a reader needs to
 * understand them: the master data by code and name, the budget, the lines of
 * the costs and what has been paid on them so far.
 *
 * @param tx - The transaction to read in
 * @param where - Which permits to read
 * @returns The permits, the latest journey first
 */
export async function readTravelPermits(
	tx: ReturnType<typeof useDatabase>,
	where: SQL | undefined,
) {
	const permits = await tx.query.travelPermits.findMany({
		where,
		with: {
			traveler: {
				columns: personColumns,
			},
			role: {
				with: {
					organizationItem: {
						columns: {
							id: true,
							name: true,
						},
					},
					budget: true,
				},
				columns: {
					id: true,
					code: true,
					name: true,
				},
			},
			specialAllocation: {
				with: {
					budget: true,
				},
				columns: {
					id: true,
					code: true,
					name: true,
				},
			},
			transportMode: {
				columns: {
					id: true,
					code: true,
					name: true,
					reasonRequired: true,
				},
			},
			transportReason: {
				columns: {
					id: true,
					code: true,
					name: true,
				},
			},
			budgetPlanItem: {
				with: {
					plan: {
						with: {
							budget: true,
						},
						columns: {
							budget: false,
						},
					},
				},
				columns: {
					plan: false,
				},
			},
			budget: true,
			items: {
				with: {
					costType: {
						columns: {
							id: true,
							code: true,
							name: true,
						},
					},
				},
				columns: {
					permit: false,
				},
				orderBy: (items) => [ asc(items.ord) ],
			},
			advance: true,
			claim: {
				with: {
					items: {
						columns: {
							claim: false,
						},
						orderBy: (items) => [ asc(items.ord) ],
					},
				},
			},
		},
		orderBy: [ desc(travelPermits.startDate) ],
	})

	return permits.map((permit) => ({
		...permit,
		traveler: withDisplayName(permit.traveler),
	}))
}

/**
 * Reads a single permit the way {@link readTravelPermits} does.
 *
 * @param tx - The transaction to read in
 * @param id - The id of the permit
 * @returns The permit, or `null` if it does not exist
 */
export async function readTravelPermit(tx: ReturnType<typeof useDatabase>, id: string) {
	const [ permit ] = await readTravelPermits(tx, eq(travelPermits.id, id))
	return permit ?? null
}
