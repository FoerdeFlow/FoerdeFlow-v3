import { eq } from 'drizzle-orm'

import type { MutationContext } from './processValidators'

/**
 * Reads the permit an advance or a claim refers to. Only the traveller may ask
 * for money on their permit, so the process has to be started by them.
 *
 * @param tx - The transaction to read in
 * @param permitId - The permit that is referred to
 * @param context - The initiator of the process
 * @returns The permit with its lines, its advance and its claim
 * @throws When the permit does not exist or belongs to someone else
 */
export async function readTravelPermitOfTraveler(
	tx: ReturnType<typeof useDatabase>,
	permitId: string,
	context: MutationContext,
) {
	const permit = await tx.query.travelPermits.findFirst({
		where: eq(travelPermits.id, permitId),
		with: {
			items: {
				columns: {
					id: true,
					amount: true,
				},
			},
			advance: {
				columns: {
					amount: true,
				},
			},
			claim: {
				columns: {
					id: true,
				},
			},
		},
		columns: {
			traveler: true,
			endDate: true,
			amount: true,
		},
	})

	// Told apart from a foreign permit only for the traveller, so that ids of
	// other permits cannot be probed.
	if(!permit || context.initiatorType !== 'person' || context.initiatorPerson !== permit.traveler) {
		throw createError({
			statusCode: 400,
			statusMessage: 'Die Dienstreisegenehmigung wurde nicht gefunden oder gehört nicht ' +
				'der antragstellenden Person',
		})
	}

	return permit
}
