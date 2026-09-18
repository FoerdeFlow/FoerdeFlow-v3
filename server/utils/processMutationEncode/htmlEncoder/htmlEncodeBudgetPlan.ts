/**
 * Splits the title of a budget plan item into the category it belongs to and
 * the title within that category. Categories are written into the title
 * separated by a dash, the same convention the PDF rendering reads.
 *
 * @param title - The title of the item
 * @returns The category, or `null` if the item carries none, and the title
 */
function splitItemTitle(title: string): [ string | null, string ] {
	const [ category, ...rest ] = title.split(' - ')
	if(category === undefined || rest.length === 0) return [ null, title ]
	return [ category, rest.join(' - ') ]
}

export function htmlEncodeBudgetPlan(entry: {
	id?: string
	budget: {
		name: string
		code: string
	} | null
	startDate: string
	endDate: string
	items: {
		title: string
		description: string | null
		revenues?: number | null
		expenses?: number | null
		ord: number | null
	}[]
}) {
	if(!entry.budget) {
		throw createError({
			status: 500,
			message: 'Invalid budgetPlan object (no budget)',
		})
	}

	const revenues = entry.items.reduce((sum, item) => sum + (item.revenues ?? 0), 0)
	const expenses = entry.items.reduce((sum, item) => sum + (item.expenses ?? 0), 0)

	const motionText = '<p>' +
		`Der Haushaltsplan des Haushalts ${escapeHtml(formatBudget(entry.budget))} ` +
		`für die Haushaltsperiode ${formatBudgetPlan(entry)} ` +
		`mit Einnahmen in Höhe von ${formatCurrency(revenues, 'amount')} ` +
		`und Ausgaben in Höhe von ${formatCurrency(expenses, 'amount')} ` +
		'wird beschlossen.' +
		'</p>'

	let category: string | null = null
	const detailsText = '<h3>Haushaltstitel</h3>' +
		'<table>' +
		'<thead>' +
		'<tr>' +
		'<th>Lfd.</th>' +
		'<th>Bezeichnung</th>' +
		'<th>Einnahmen</th>' +
		'<th>Ausgaben</th>' +
		'</tr>' +
		'</thead>' +
		'<tbody>' +
		entry.items.map((item) => {
			const [ itemCategory, itemTitle ] = splitItemTitle(item.title)
			const categoryRow = itemCategory !== null && itemCategory !== category
				? `<tr><th colspan="4">${escapeHtml(itemCategory)}</th></tr>`
				: ''
			category = itemCategory

			return categoryRow +
				'<tr>' +
				`<td>${item.ord ?? ''}</td>` +
				'<td>' +
					`${escapeHtml(itemTitle)}<br />` +
					`<span style="font-size: 0.8em">${escapeHtml(item.description ?? '')}</span>` +
				'</td>' +
				`<td>${formatCurrency(item.revenues ?? 0)}</td>` +
				`<td>${formatCurrency(item.expenses ?? 0)}</td>` +
				'</tr>'
		}).join('') +
		'</tbody>' +
		'<tfoot>' +
		'<tr>' +
		'<th></th>' +
		'<th>Summe Einnahmen/Ausgaben</th>' +
		`<th>${formatCurrency(revenues, 'amount')}</th>` +
		`<th>${formatCurrency(expenses, 'amount')}</th>` +
		'</tr>' +
		'</tfoot>' +
		'</table>'

	return motionText + detailsText
}
