function escapeHtml(htmlStr: string) {
	return htmlStr.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;')
}

export function htmlEncodeRepresentationAllowance(entry: {
	id?: string
	organizationItem: {
		name: string
		code: string
	} | null
	title: string
	description: string | null
	periodUnit: 'month' | 'once'
	startDate: string
	endDate: string | null
	recipients: {
		ord: number | null
		amount: number
		person: {
			firstName: string
			lastName: string
			callName: string | null
			pronouns: string | null
		} | null
	}[]
}) {
	if(!entry.organizationItem) {
		throw createError({
			status: 500,
			message: 'Invalid representationAllowance object (no organizationItem)',
		})
	}

	const total = entry.recipients.reduce((sum, recipient) => sum + recipient.amount, 0)

	const period = entry.periodUnit === 'once'
		? `zum ${formatDate(entry.startDate, 'compact')} `
		: entry.endDate
			? `für den Zeitraum ${formatBudgetPlan({
				startDate: entry.startDate,
				endDate: entry.endDate,
			})} `
			: `ab ${formatDate(entry.startDate, 'compact')} (unbefristet) `

	const amount = entry.periodUnit === 'once'
		? `in Höhe von ${formatCurrency(total)} `
		: `in Höhe von ${formatCurrency(total)} je Monat `

	const motionText = '<p>' +
		`Die ${entry.periodUnit === 'once' ? 'einmalige ' : ''}Aufwandsentschädigung ` +
		`„${escapeHtml(entry.title)}“ ` +
		`der Organisationseinheit ${escapeHtml(formatOrganizationItem(entry.organizationItem))} ` +
		amount +
		period +
		'wird genehmigt.' +
		'</p>'

	const descriptionText = entry.description
		? `<p>${escapeHtml(entry.description)}</p>`
		: ''

	const detailsText = '<h3>Empfängerinnen und Empfänger</h3>' +
		'<table>' +
		'<thead>' +
		'<tr>' +
		'<th>Lfd.</th>' +
		'<th>Person</th>' +
		`<th>${entry.periodUnit === 'once' ? 'Betrag' : 'Betrag je Monat'}</th>` +
		'</tr>' +
		'</thead>' +
		'<tbody>' +
		entry.recipients.map((recipient) => '<tr>' +
			`<td>${recipient.ord ?? ''}</td>` +
			`<td>${escapeHtml(formatPerson(recipient.person, 'long'))}</td>` +
			`<td>${formatCurrency(recipient.amount)}</td>` +
			'</tr>').join('') +
		'</tbody>' +
		'<tfoot>' +
		'<tr>' +
		'<th></th>' +
		'<th>Summe</th>' +
		`<th>${formatCurrency(total)}</th>` +
		'</tr>' +
		'</tfoot>' +
		'</table>'

	return motionText + descriptionText + detailsText
}
