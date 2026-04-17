function escapeHtml(htmlStr: string) {
	return htmlStr.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;')
}

export function htmlEncodeExpenseAuthorization(entry: {
	id?: string
	budgetPlanItem: {
		title: string
		plan: {
			budget: {
				name: string
				code: string
			}
			startDate: string
			endDate: string
		}
	}
	title: string
	description: string | null
	items: {
		title: string
		description: string | null
		amount: number
		ord: number | null
	}[]
}) {
	const motionText = '<p>' +
		`Die Ausgabe „${entry.title}“ ` +
		`aus dem Haushalt ${formatBudget(entry.budgetPlanItem.plan.budget)} ` +
		`in der Haushaltsperiode ${formatBudgetPlan(entry.budgetPlanItem.plan)} ` +
		`mit Ausgaben in Höhe von ${formatCurrency(entry.items.reduce((sum, item) => sum + item.amount, 0))} ` +
		'wird genehmigt.' +
		'</p>'

	const detailsText = '<h3>Kostenaufstellung</h3>' +
		'<table>' +
		'<thead>' +
		'<tr>' +
		'<th>Lfd.</th>' +
		'<th>Bezeichnung</th>' +
		'<th>Betrag</th>' +
		'</tr>' +
		'</thead>' +
		'<tbody>' +
		entry.items.map((item) => (
			'<tr>' +
			`<td>${item.ord ?? ''}</td>` +
			'<td>' +
				`${escapeHtml(item.title)}<br />` +
				`<span style="font-size: 0.8em">${escapeHtml(item.description ?? '')}</span>` +
			'</td>' +
			`<td>${formatCurrency(item.amount)}</td>` +
			'</tr>'
		)).join('') +
		'</tbody>' +
		'</table>'

	return motionText + detailsText
}
