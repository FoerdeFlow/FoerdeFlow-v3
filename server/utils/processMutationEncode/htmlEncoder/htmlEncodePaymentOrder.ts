function escapeHtml(htmlStr: string) {
	return htmlStr.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;')
}

export function htmlEncodePaymentOrder(entry: {
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
	} | null
	budget: {
		name: string
		code: string
	} | null
	expenseAuthorization: {
		title: string
		amount: number
	} | null
	recipientType: 'reimbursement' | 'invoice'
	recipientPerson: {
		firstName: string
		lastName: string
		callName: string | null
		pronouns: string | null
	} | null
	recipientName: string | null
	recipientIban: string | null
	purpose: string | null
	title: string
	description: string | null
	amount: number
}) {
	const budgetData = entry.budgetPlanItem?.plan.budget ?? entry.budget
	if(!budgetData) {
		throw createError({
			status: 500,
			message: 'Invalid paymentOrder object (neither budget nor budgetPlanItem)',
		})
	}

	const recipient = entry.recipientType === 'reimbursement'
		? `zur Auslagenerstattung an ${formatPerson(entry.recipientPerson, 'long')} `
		: `zur Begleichung der Rechnung von ${escapeHtml(entry.recipientName ?? '')} `

	const motionText = '<p>' +
		`Die Zahlung „${escapeHtml(entry.title)}“ ` +
		(entry.budgetPlanItem
			? `aus dem Haushalt ${formatBudget(budgetData)} ` +
				`in der Haushaltsperiode ${formatBudgetPlan(entry.budgetPlanItem.plan)} `
			: `aus der Rücklage des Haushalts ${formatBudget(budgetData)} `) +
		recipient +
		`in Höhe von ${formatCurrency(entry.amount)} ` +
		'wird angewiesen.' +
		'</p>'

	const rows: { key: string, value: string }[] = [
		...entry.budgetPlanItem
			? [ { key: 'Haushaltstitel', value: escapeHtml(entry.budgetPlanItem.title) } ]
			: [],
		...entry.expenseAuthorization
			? [ {
				key: 'Ausgabeermächtigung',
				value: `${escapeHtml(entry.expenseAuthorization.title)} ` +
					`(${formatCurrency(entry.expenseAuthorization.amount)})`,
			} ]
			: [],
		...entry.recipientType === 'invoice'
			? [
				// The IBAN of a member is not repeated here, it is kept with the
				// person and only shown to those who may see bank details.
				{ key: 'IBAN', value: formatIban(entry.recipientIban) },
				{ key: 'Verwendungszweck', value: escapeHtml(entry.purpose ?? '') },
			]
			: [],
		...entry.description
			? [ { key: 'Beschreibung', value: escapeHtml(entry.description) } ]
			: [],
		{ key: 'Betrag', value: formatCurrency(entry.amount) },
	]

	const detailsText = '<h3>Angaben zur Zahlung</h3>' +
		'<table>' +
		'<tbody>' +
		rows.map((row) => (
			'<tr>' +
			`<th>${row.key}</th>` +
			`<td>${row.value}</td>` +
			'</tr>'
		)).join('') +
		'</tbody>' +
		'</table>'

	return motionText + detailsText
}
