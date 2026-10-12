import type { ExpandedProcessMutations } from '~~/server/types/expandedProcessMutations'

import type { TravelRow } from '../travelRows'

/**
 * Renders rows of plain text as a table, escaping every value.
 *
 * @param heading - The heading above the table
 * @param rows - The rows of the table
 * @returns The html of the table
 */
function htmlTable(heading: string, rows: TravelRow[]) {
	return `<h3>${escapeHtml(heading)}</h3>` +
		'<table>' +
		'<tbody>' +
		rows.map((row) => (
			'<tr>' +
			`<th>${escapeHtml(row.key)}</th>` +
			`<td>${escapeHtml(row.value)}</td>` +
			'</tr>'
		)).join('') +
		'</tbody>' +
		'</table>'
}

export function htmlEncodeTravelPermit(entry: ExpandedProcessMutations['travelPermit']) {
	const budget = travelPermitOrigin(entry)
	const total = travelPermitLimits(entry, null).total

	const motionText = '<p>' +
		`Die Dienstreise „${escapeHtml(entry.title)}“ nach ${escapeHtml(entry.destination)} ` +
		`im Zeitraum ${formatBudgetPlan(entry)} ` +
		`wird zu Lasten des Haushalts ${escapeHtml(formatBudget(budget))} ` +
		`mit Kosten von bis zu ${formatCurrency(total, 'amount')} genehmigt.` +
		'</p>'

	return motionText +
		htmlTable('Angaben zur Dienstreise', travelPermitRows(entry)) +
		htmlTable('Reisende und genehmigte Kosten', travelPermitTravelerRows(entry))
}

export function htmlEncodeTravelClaim(entry: ExpandedProcessMutations['travelClaim']) {
	if(!entry.permit) {
		throw createError({
			status: 500,
			message: 'Invalid travelClaim object (no permit)',
		})
	}

	const motionText = '<p>' +
		`Die Reisekosten zur Dienstreise „${escapeHtml(entry.title ?? entry.permit.title)}“ ` +
		`werden in Höhe von ${formatCurrency(entry.amount, 'amount')} erstattet.` +
		'</p>'

	return motionText +
		htmlTable('Angaben zur Reise', travelClaimRows(entry)) +
		htmlTable('Kosten', [ ...travelClaimItemRows(entry), ...travelClaimTotalRows(entry) ]) +
		htmlTable('Genehmigung', travelPermitRows(entry.permit))
}
