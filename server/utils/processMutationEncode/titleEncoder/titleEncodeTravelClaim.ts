import type { ExpandedProcessMutations } from '~~/server/types/expandedProcessMutations'

export function titleEncodeTravelClaim(entry: ExpandedProcessMutations['travelClaim']) {
	if(!entry.permit) {
		throw createError({
			status: 500,
			message: 'Invalid travelClaim object (no permit)',
		})
	}

	return `${travelPermitOrigin(entry.permit).code} - Reisekosten: ` +
		(entry.title ?? entry.permit.title)
}
