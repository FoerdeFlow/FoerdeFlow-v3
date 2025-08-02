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
	} catch(e) {
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
	} catch(e) {
		return ''
	}
}

export function formatRoom(room: { building: { code: string }, code: string, level: number, name: string } | null): string {
	if(!room) return ''
	const level = room.level < 0 ? 'K' : room.level
	return `${room.building.code}-${level}.${room.code} (${room.name})`
}

export function formatSessionNumber(period: number, number: number): string {
	const periodCode = `${(period % 100).toString().padStart(2, '0')}${((period + 1) % 100).toString().padStart(2, '0')}`
	return `${periodCode}-${number.toString().padStart(2, '0')}`
}