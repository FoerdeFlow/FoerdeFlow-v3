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