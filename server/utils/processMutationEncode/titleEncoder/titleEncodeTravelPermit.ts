import type { ExpandedProcessMutations } from '~~/server/types/expandedProcessMutations'

export function titleEncodeTravelPermit(entry: ExpandedProcessMutations['travelPermit']) {
	return `${travelPermitOrigin(entry).code} - Dienstreise: ${entry.title}`
}
