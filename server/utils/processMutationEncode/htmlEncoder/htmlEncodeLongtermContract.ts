const timeUnitLabels = {
	month: 'Monat',
	quarter: 'Quartal',
	semester: 'Semester',
	year: 'Jahr',
} as const

function escapeHtml(htmlStr: string) {
	return htmlStr.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;')
}

function formatItemCondition(item: {
	type: 'time' | 'usage' | 'fixed'
	timeUnit: 'month' | 'quarter' | 'semester' | 'year' | null
	usageUnit: string | null
	expectedUsage: number | null
}): string {
	switch(item.type) {
		case 'time':
			return item.timeUnit
				? `je ${timeUnitLabels[item.timeUnit]}`
				: ''
		case 'usage':
			return [
				item.usageUnit ? `je ${item.usageUnit}` : '',
				item.expectedUsage !== null && item.timeUnit
					? `erwartet ${item.expectedUsage} je ${timeUnitLabels[item.timeUnit]}`
					: '',
			].filter(Boolean).join(' · ')
		case 'fixed':
			return 'einmalig'
	}
}

export function htmlEncodeLongtermContract(entry: {
	id?: string
	budget: {
		name: string
		code: string
	} | null
	title: string
	description: string | null
	startDate: string
	endDate: string | null
	items: {
		ord: number | null
		type: 'time' | 'usage' | 'fixed'
		title: string
		description: string | null
		amount: number
		timeUnit: 'month' | 'quarter' | 'semester' | 'year' | null
		usageUnit: string | null
		expectedUsage: number | null
	}[]
}) {
	if(!entry.budget) {
		throw createError({
			status: 500,
			message: 'Invalid longtermContract object (no budget)',
		})
	}

	const period = entry.endDate
		? `für den Zeitraum ${formatBudgetPlan({ startDate: entry.startDate, endDate: entry.endDate })} `
		: `ab ${formatDate(entry.startDate, 'compact')} (unbefristet) `

	const motionText = '<p>' +
		`Der Langzeitvertrag „${entry.title}“ ` +
		`aus dem Haushalt ${formatBudget(entry.budget)} ` +
		period +
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
		entry.items.map((item) => {
			const condition = formatItemCondition(item)
			const subLine = [ condition, item.description ].filter(Boolean).join(' — ')
			return '<tr>' +
				`<td>${item.ord ?? ''}</td>` +
				'<td>' +
					`${escapeHtml(item.title)}<br />` +
					`<span style="font-size: 0.8em">${escapeHtml(subLine)}</span>` +
				'</td>' +
				`<td>${formatCurrency(item.amount)}</td>` +
				'</tr>'
		}).join('') +
		'</tbody>' +
		'</table>'

	return motionText + detailsText
}
