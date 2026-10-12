import type { SQL } from 'drizzle-orm'

import { eq } from 'drizzle-orm'

import type { EventContext } from '../types'

const personColumns = {
	id: true,
	firstName: true,
	lastName: true,
	callName: true,
	pronouns: true,
} as const

/**
 * Reads permits for official journeys with everything a reader needs, and
 * keeps only those the current user may see: the travellers always see their
 * own permits, everyone else needs `travelPermits.read` for the organization
 * item the budget belongs to.
 *
 * @param where - The condition the permits are read with
 * @returns The permits the user may see, with their travellers and claims
 */
export async function readTravelPermits(where?: SQL) {
	const event = useEvent()
	const person = (event.context as EventContext).user?.person?.id ?? null

	const database = useDatabase()

	const permits = await database.query.travelPermits.findMany({
		where,
		with: {
			budget: true,
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
			travelers: {
				with: {
					person: { columns: personColumns },
				},
				columns: {
					permit: false,
					person: false,
				},
				orderBy: (travelers, { asc }) => [ asc(travelers.ord) ],
			},
			claims: {
				with: {
					recipientPerson: { columns: personColumns },
				},
				columns: {
					recipientPerson: false,
				},
			},
		},
		orderBy: (permits, { desc }) => [ desc(permits.startDate) ],
	})

	return permits
		.filter((permit) => {
			if(permit.travelers.some((traveler) => traveler.person.id === person)) return true
			const budget = permit.budgetPlanItem?.plan.budget ?? permit.budget
			return !!budget && hasPermission('travelPermits.read', {
				organizationItem: budget.organizationItem,
			})
		})
		.map((permit) => ({
			...permit,
			travelers: permit.travelers.map((traveler) => ({
				...traveler,
				person: withDisplayName(traveler.person),
			})),
			claims: permit.claims.map((claim) => ({
				...claim,
				recipientPerson: withDisplayName(claim.recipientPerson),
			})),
		}))
}

/**
 * Reads a single permit for official journeys the current user may see.
 *
 * @param id - The id of the permit
 * @returns The permit
 * @throws When the permit does not exist or the user may not see it
 */
export async function readTravelPermit(id: string) {
	const [ permit ] = await readTravelPermits(eq(travelPermits.id, id))
	if(!permit) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Dienstreisegenehmigung nicht gefunden',
			data: { travelPermitId: id },
		})
	}
	return permit
}
