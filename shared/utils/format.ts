const dateFormatter = {
	verbose: new Intl.DateTimeFormat('de-DE', {
		dateStyle: 'full',
	}),
	compact: new Intl.DateTimeFormat('de-DE', {
		dateStyle: 'medium',
	}),
}

export function formatDate(date: string | Date | null, style: 'verbose' | 'compact' = 'verbose'): string {
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
	}),
	compact: new Intl.DateTimeFormat('de-DE', {
		dateStyle: 'medium',
		timeStyle: 'short',
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
		callName: string | null,
		pronouns: string | null,
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
