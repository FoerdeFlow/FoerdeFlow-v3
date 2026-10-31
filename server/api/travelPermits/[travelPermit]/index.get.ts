import { z } from 'zod'

/** Reads a permit of the user, a foreign one is treated as if it did not exist. */
export default defineEventHandler(async (event) => {
	const person = requireTravelPerson(event)

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		travelPermit: idSchema,
	}).parseAsync(data))

	const permit = await readTravelPermit(useDatabase(), params.travelPermit)
	if(permit?.traveler.id !== person) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Dienstreisegenehmigung nicht gefunden',
			data: {
				travelPermitId: params.travelPermit,
			},
		})
	}

	return {
		...permit,
		claimDeadline: travelClaimDeadline(permit.endDate),
	}
})
