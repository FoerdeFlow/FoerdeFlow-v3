const timeZone = 'Europe/Berlin'

const dateFormatter = {
	verbose: new Intl.DateTimeFormat('de-DE', {
		dateStyle: 'full',
		timeZone,
	}),
	compact: new Intl.DateTimeFormat('de-DE', {
		dateStyle: 'medium',
		timeZone,
	}),
	iso: {
		format: (date: Date) => [
			date.getFullYear().toString().padStart(4, '0'),
			(date.getMonth() + 1).toString().padStart(2, '0'),
			date.getDate().toString().padStart(2, '0'),
		].join('-'),
	},
}

export function formatDate(date: string | Date | null, style: 'verbose' | 'compact' | 'iso' = 'verbose'): string {
	if(!date) return ''
	try {
		return dateFormatter[style].format(new Date(date))
	} catch(_) {
		return ''
	}
}

const datetimeFormatter = {
	verbose: new Intl.DateTimeFormat('de-DE', {
		dateStyle: 'full',
		timeStyle: 'short',
		timeZone,
	}),
	compact: new Intl.DateTimeFormat('de-DE', {
		dateStyle: 'medium',
		timeStyle: 'short',
		timeZone,
	}),
}

export function formatDatetime(date: string | Date | null, style: 'verbose' | 'compact' = 'verbose'): string {
	if(!date) return ''
	try {
		return datetimeFormatter[style].format(new Date(date))
	} catch(_) {
		return ''
	}
}

const timeFormatter = new Intl.DateTimeFormat('de-DE', {
	timeStyle: 'short',
	timeZone,
})

export function formatTime(date: string | Date | null): string {
	if(!date) return ''
	try {
		return timeFormatter.format(new Date(date))
	} catch(_) {
		return ''
	}
}

const currencyFormatter = new Intl.NumberFormat('de-DE', {
	style: 'currency',
	currency: 'EUR',
})

export function formatCurrency(
	value: number | null,
): string {
	if(!value) return ''
	try {
		return currencyFormatter.format(value)
	} catch(_) {
		return ''
	}
}

const currencyAmountFormatter = new Intl.NumberFormat('de-DE', {
	minimumFractionDigits: 2,
	maximumFractionDigits: 2,
})

// Money as it is written into an input field: German notation, but without the
// currency symbol, so that parseCurrency() can read it back.
export function formatCurrencyAmount(
	value: number | null,
): string {
	if(value === null || !Number.isFinite(value)) return ''
	try {
		return currencyAmountFormatter.format(value)
	} catch(_) {
		return ''
	}
}

const currencyPattern = /^[+-]?(?:\d{1,3}(?:\.\d{3})+|\d*)(?:,\d*)?$/

// Reads money in the German notation, i.e. with a comma as the decimal
// separator and an optional dot as the thousands separator. Returns null if the
// value is not a well-formed amount.
export function parseCurrency(
	value: string,
): number | null {
	const text = value.replace(/[\s\u00a0€]/g, '')
	if(text === '' || !currencyPattern.test(text)) return null
	const result = Number(text.replaceAll('.', '').replace(',', '.'))
	if(!Number.isFinite(result)) return null
	return Math.round(result * 100) / 100
}

export function formatBuilding(
	building: {
		code: string
		name: string
	} | null,
): string {
	if(!building) return ''
	return `${building.code} (${building.name})`
}

export function formatRoom(
	room: { building: { code: string }, code: string, level: number, name: string } | null,
): string {
	if(!room) return ''
	const level = room.level < 0 ? 'K' : room.level
	return `${room.building.code}-${level}.${room.code} (${room.name})`
}

export function formatPeriod(period: number): string {
	return `${period}/${period + 1}`
}

export function formatSessionNumber(period: number, number: number): string {
	const periodCode = [
		(period % 100).toString().padStart(2, '0'),
		((period + 1) % 100).toString().padStart(2, '0'),
	].join('')
	return `${periodCode}-${number.toString().padStart(2, '0')}`
}

export function formatPerson(
	person: {
		firstName: string,
		lastName: string,
		callName?: string | null,
		pronouns?: string | null,
	} | null,
	style: 'short' | 'long' = 'short',
): string {
	if(!person) return ''
	let result = `${person.callName ?? person.firstName} ${person.lastName}`
	if(style === 'long' && person.pronouns) {
		result += ` (${person.pronouns})`
	}
	return result
}

export function formatOrganizationType(
	item: {
		name: string,
		code: string,
	} | null,
): string {
	if(!item) return ''
	return `${item.name} (${item.code})`
}
export function formatOrganizationItem(
	item: {
		name: string,
		code: string,
	} | null,
): string {
	if(!item) return ''
	return `${item.name} (${item.code})`
}

export function formatMembershipType(
	membershipType: {
		name: string,
		code: string,
	} | null,
): string {
	if(!membershipType) return ''
	return `${membershipType.name} (${membershipType.code})`
}

export function formatMembershipEndReason(
	endReason: {
		name: string,
		code: string,
	} | null,
): string {
	if(!endReason) return ''
	return `${endReason.name} (${endReason.code})`
}

export function formatWorkflow(
	workflow: {
		name: string,
		code: string,
	} | null,
): string {
	if(!workflow) return ''
	return `${workflow.name} (${workflow.code})`
}

export function formatWorkflowStepType(type: 'comment' | 'task' | 'approval' | 'job'): string {
	return {
		comment: 'Stellungnahme',
		task: 'Aufgabe',
		approval: 'Genehmigung',
		job: 'Automatischer Schritt',
	}[type]
}

export function formatWorkflowMutationAction(action: 'create' | 'update' | 'delete'): string {
	return {
		create: 'Erstellen',
		update: 'Aktualisieren',
		delete: 'Löschen',
	}[action]
}

export function formatProcessStatus(type: 'pending' | 'completed' | 'failed'): string {
	return {
		pending: 'Offen',
		completed: 'Abgeschlossen',
		failed: 'Fehlgeschlagen',
	}[type]
}

export function formatProcessStepStatus(type: 'pending' | 'completed' | 'failed'): string {
	return {
		pending: 'Offen',
		completed: 'Abgeschlossen',
		failed: 'Fehlgeschlagen',
	}[type]
}

export function formatProcessSignatureStatus(type: 'pending' | 'received'): string {
	return {
		pending: 'Ausstehend',
		received: 'Eingegangen',
	}[type]
}

export function formatProcessPaperStatus(
	type: 'notRequired' | 'pending' | 'received',
): string {
	return {
		notRequired: 'Nicht erforderlich',
		pending: 'Papier ausstehend',
		received: 'Papier vollständig',
	}[type]
}

export function formatBudget(
	budget: {
		name: string,
		code: string,
	} | null,
): string {
	if(!budget) return ''
	return `${budget.name} (${budget.code})`
}

export function formatBudgetPlan(
	budgetPlan: {
		startDate: string | Date | null,
		endDate: string | Date | null,
	} | null,
): string {
	if(!budgetPlan) return ''
	return `${formatDate(budgetPlan.startDate, 'compact')} - ${formatDate(budgetPlan.endDate, 'compact')}`
}

export function formatBudgetPlanItem(
	budgetPlanItem: {
		ord: number | null,
		title: string,
	} | null,
): string {
	if(!budgetPlanItem) return ''
	return `${budgetPlanItem.title} (${budgetPlanItem.ord ?? '–'})`
}

/**
 * Names the receiving side of a payment order, no matter which of the two kinds
 * it is: a member who is reimbursed or a company that sent an invoice.
 *
 * @param paymentOrder - The payment order to name the recipient of
 * @returns The name of the recipient
 */
export function formatPaymentOrderRecipient(
	paymentOrder: {
		recipientPerson?: {
			firstName: string,
			lastName: string,
			callName?: string | null,
			pronouns?: string | null,
		} | null,
		recipientName?: string | null,
	} | null,
): string {
	if(!paymentOrder) return ''
	return paymentOrder.recipientPerson
		? formatPerson(paymentOrder.recipientPerson)
		: paymentOrder.recipientName ?? ''
}

export function formatRole(
	role: {
		name: string,
		code: string,
	} | null,
): string {
	if(!role) return ''
	return `${role.name} (${role.code})`
}

export function formatDocumentNumber(period: number, number: number | null): string {
	const periodCode = [
		(period % 100).toString().padStart(2, '0'),
		((period + 1) % 100).toString().padStart(2, '0'),
	].join('')
	const numberCode = number?.toString().padStart(3, '0') ?? 'XXX'
	return `${periodCode}-${numberCode}`
}

export function formatCouncil(
	council: {
		code: string,
		name: string,
	} | null,
): string {
	if(!council) return ''
	return `${council.name} (${council.code})`
}

export function formatDepartment(
	department: {
		code: string,
		name: string,
	} | null,
): string {
	if(!department) return ''
	return `${department.name} (${department.code})`
}

export function formatCourse(
	course: {
		code: string,
		name: string,
	} | null,
): string {
	if(!course) return ''
	return `${course.name} (${course.code})`
}

export function formatCourseType(
	courseType: {
		code: string,
		name: string,
	} | null,
): string {
	if(!courseType) return ''
	return `${courseType.name} (${courseType.code})`
}

export function formatElection(
	election: {
		title: string,
	} | null,
): string {
	if(!election) return ''
	return election.title
}

export function formatReferencedPerson(
	reference: string | null,
	mutations?: {
		mutation: {
			table: string,
		},
		data: Record<string, unknown>,
	}[],
) {
	if(!reference || !mutations) return ''
	const [ table, ...steps ] = reference.split('.')

	let data: Record<string, unknown> | null | undefined =
		mutations.find((m) => m.mutation.table === table)?.data
	while(typeof data === 'object' && data !== null && steps.length > 0) {
		const step = steps.shift()
		if(step === undefined) break
		data = data[step] as Record<string, unknown> | null | undefined
	}
	return formatPerson((data ?? null) as Parameters<typeof formatPerson>[0])
}
