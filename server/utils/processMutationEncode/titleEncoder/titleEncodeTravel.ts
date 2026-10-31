import type { ExpandedProcessMutations } from '~~/server/types/expandedProcessMutations'

export function titleEncodeTravelPermit(entry: ExpandedProcessMutations['travelPermit']) {
	return `Dienstreise - ${entry.title}`
}

export function titleEncodeTravelAdvance(entry: ExpandedProcessMutations['travelAdvance']) {
	return `Vorschuss - ${entry.permit?.title ?? '–'}`
}

export function titleEncodeTravelClaim(entry: ExpandedProcessMutations['travelClaim']) {
	return `Reisekostenerstattung - ${entry.permit?.title ?? '–'}`
}
