export function htmlEncodeExpenseAuthorization(entry: {
	id?: string
	budgetPlanItem: {
		title: string
		/** Whether the title itself is still being applied for. */
		pending?: boolean
		plan: {
			budget: {
				name: string
				code: string
			}
			startDate: string
			endDate: string
			/** Whether the plan is still being applied for. */
			pending?: boolean
		}
	} | null
	budget: {
		name: string
		code: string
	} | null
	title: string
	description: string | null
	items: {
		title: string
		description: string | null
		amount: number
		ord: number | null
	}[]
}) {
	const budgetData = entry.budgetPlanItem?.plan.budget ?? entry.budget
	if(!budgetData) {
		throw createError({
			status: 500,
			message: 'Invalid expenseAuthorization object (neither budget nor budgetPlanItem)',
		})
	}

	const total = entry.items.reduce((sum, item) => sum + item.amount, 0)

	const motionText = '<p>' +
		`Die Ausgabe „${escapeHtml(entry.title)}“ ` +
		(entry.budgetPlanItem
			? `aus dem Haushalt ${escapeHtml(formatBudget(budgetData))} ` +
				`in der Haushaltsperiode ${formatBudgetPlan(entry.budgetPlanItem.plan)} ` +
				(entry.budgetPlanItem.plan.pending
					? 'nach Maßgabe des beantragten Haushaltsplans '
					: entry.budgetPlanItem.pending
						? 'nach Maßgabe des beantragten Nachtrags zum Haushaltsplan '
						: '')
			: `aus der Rücklage des Haushalts ${escapeHtml(formatBudget(budgetData))} `) +
		`mit Ausgaben in Höhe von ${formatCurrency(total, 'amount')} ` +
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
