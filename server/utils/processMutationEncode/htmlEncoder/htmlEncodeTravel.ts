import type { ExpandedProcessMutations } from '~~/server/types/expandedProcessMutations'

import type { TravelRow } from '../travelRows'

function htmlTravelTable(heading: string, rows: TravelRow[]) {
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
	return '<p>' +
		`Die Dienstreise „${escapeHtml(entry.title)}“ von ` +
		`${escapeHtml(formatPerson(entry.traveler) || '–')} ` +
		`mit voraussichtlichen Kosten in Höhe von ${formatCurrency(entry.amount, 'amount')} ` +
		'wird genehmigt.' +
		'</p>' +
		htmlTravelTable('Angaben zur Dienstreise', travelPermitRows(entry)) +
		htmlTravelTable('Voraussichtliche Kosten', travelPermitCostRows(entry))
}

export function htmlEncodeTravelAdvance(entry: ExpandedProcessMutations['travelAdvance']) {
	return '<p>' +
		`Auf die Dienstreise „${escapeHtml(entry.permit?.title ?? '–')}“ wird ein Vorschuss ` +
		`in Höhe von ${formatCurrency(entry.amount, 'amount')} gezahlt.` +
		'</p>' +
		(entry.permit ? htmlTravelTable('Angaben zur Dienstreise', travelPermitRows(entry.permit)) : '')
}

export function htmlEncodeTravelClaim(entry: ExpandedProcessMutations['travelClaim']) {
	return '<p>' +
		`Für die Dienstreise „${escapeHtml(entry.permit?.title ?? '–')}“ werden Reisekosten ` +
		`in Höhe von ${formatCurrency(entry.amount, 'amount')} erstattet.` +
		'</p>' +
		htmlTravelTable('Kosten', travelClaimCostRows(entry)) +
		(entry.permit ? htmlTravelTable('Angaben zur Dienstreise', travelPermitRows(entry.permit)) : '')
}
