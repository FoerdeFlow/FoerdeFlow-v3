/**
 * Ein Eintrag, wie ihn der Kalender-Feed ausgibt. Sitzungen und Veranstaltungen
 * werden vor dem Schreiben auf diese gemeinsame Form gebracht.
 */
export interface IcsEvent {
	/** Stabil über Abrufe hinweg, damit Clients den Termin wiedererkennen. */
	uid: string
	summary: string
	start: Date
	/**
	 * Das Ende, wie es der Mensch versteht: bei einem ganztägigen Termin der
	 * letzte Tag einschließlich. Fehlt es, ist der Termin ein Zeitpunkt.
	 */
	end?: Date | null
	allDay?: boolean
	location?: string | null
	description?: string | null
	conferenceUrl?: string | null
	categories?: (string | null | undefined)[]
	cancelled?: boolean
}

/**
 * Maskiert einen Text für ein TEXT-Feld nach RFC 5545, Abschnitt 3.3.11.
 *
 * @param value - Der rohe Text
 * @returns Der maskierte Text
 */
function escapeText(value: string): string {
	return value
		.replace(/\\/g, '\\\\')
		.replace(/;/g, '\\;')
		.replace(/,/g, '\\,')
		.replace(/\r\n|\r|\n/g, '\\n')
}

/**
 * Bricht eine Zeile auf 75 Oktette um, wie RFC 5545 es verlangt. Gezählt werden
 * UTF-8-Bytes, nicht Zeichen, und ein Mehrbyte-Zeichen darf dabei nicht
 * auseinandergerissen werden.
 *
 * @param line - Die ungefaltete Zeile
 * @returns Die gefaltete Zeile, Folgezeilen mit einem Leerzeichen eingerückt
 */
function foldLine(line: string): string {
	const encoder = new TextEncoder()
	if(encoder.encode(line).length <= 75) return line

	const parts: string[] = []
	let current = ''
	let currentBytes = 0
	// Über Codepoints laufen, damit kein Ersatzpaar zerfällt.
	for(const char of line) {
		const size = encoder.encode(char).length
		// Die Folgezeilen tragen ein führendes Leerzeichen und haben daher 74 frei.
		const limit = parts.length === 0 ? 75 : 74
		if(currentBytes + size > limit) {
			parts.push(current)
			current = ''
			currentBytes = 0
		}
		current += char
		currentBytes += size
	}
	if(current !== '') parts.push(current)

	return parts.map((part, index) => index === 0 ? part : ` ${part}`).join('\r\n')
}

/**
 * Schreibt einen Zeitpunkt als UTC, etwa `20261005T123000Z`. Der Feed nennt
 * ausschließlich UTC, damit er ohne eingebettete VTIMEZONE eindeutig bleibt.
 *
 * @param date - Der Zeitpunkt
 * @returns Der Wert für ein DATE-TIME-Feld
 */
function formatUtc(date: Date): string {
	return `${date.toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`
}

// `en-CA` liefert ISO-Schreibweise, und die Zeitzone ist die, in der die
// Anwendung ihre Termine anzeigt.
const dayFormatter = new Intl.DateTimeFormat('en-CA', {
	timeZone: 'Europe/Berlin',
	year: 'numeric',
	month: '2-digit',
	day: '2-digit',
})

/**
 * Schreibt einen Tag als `20260928`, gesehen aus der Zeitzone der Anwendung.
 *
 * @param date - Der Zeitpunkt, dessen Tag gemeint ist
 * @param addDays - Wie viele Tage danach gemeint sind
 * @returns Der Wert für ein DATE-Feld
 */
function formatDay(date: Date, addDays = 0): string {
	const [ year = '1970', month = '01', day = '01' ] = dayFormatter.format(date).split('-')
	// Über UTC rechnen, damit weder die Zeitzone des Servers noch eine
	// Sommerzeitumstellung den Tag verschieben kann.
	const shifted = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day) + addDays))
	return shifted.toISOString().slice(0, 10).replace(/-/g, '')
}

/**
 * Baut einen vollständigen iCalendar-Datenstrom.
 *
 * @param events - Die Termine
 * @param options - Name des Kalenders und der Zeitpunkt der Erzeugung
 * @returns Der Inhalt der ICS-Datei
 */
export function buildIcs(
	events: IcsEvent[],
	options: { name: string, now: Date },
): string {
	const lines: string[] = [
		'BEGIN:VCALENDAR',
		'VERSION:2.0',
		'PRODID:-//FördeFlow//Kalender//DE',
		'CALSCALE:GREGORIAN',
		'METHOD:PUBLISH',
		`X-WR-CALNAME:${escapeText(options.name)}`,
		'X-WR-TIMEZONE:Europe/Berlin',
	]

	for(const event of events) {
		lines.push('BEGIN:VEVENT')
		lines.push(`UID:${event.uid}`)
		lines.push(`DTSTAMP:${formatUtc(options.now)}`)

		if(event.allDay) {
			lines.push(`DTSTART;VALUE=DATE:${formatDay(event.start)}`)
			// DTEND ist in iCalendar ausschließend, unsere Termine enden
			// einschließlich — daher ein Tag darauf.
			lines.push(`DTEND;VALUE=DATE:${formatDay(event.end ?? event.start, 1)}`)
		} else {
			lines.push(`DTSTART:${formatUtc(event.start)}`)
			// Ohne Ende bleibt DTEND weg: der Termin ist dann ein Zeitpunkt.
			if(event.end) lines.push(`DTEND:${formatUtc(event.end)}`)
		}

		lines.push(`SUMMARY:${escapeText(event.summary)}`)
		if(event.location) lines.push(`LOCATION:${escapeText(event.location)}`)
		if(event.description) lines.push(`DESCRIPTION:${escapeText(event.description)}`)
		if(event.conferenceUrl) {
			lines.push(`CONFERENCE;VALUE=URI;FEATURE=VIDEO:${event.conferenceUrl}`)
		}
		const categories = (event.categories ?? []).filter((c) => Boolean(c))
		if(categories.length > 0) {
			lines.push(`CATEGORIES:${categories.map((c) => escapeText(c ?? '')).join(',')}`)
		}
		if(event.cancelled) lines.push('STATUS:CANCELLED')
		lines.push('END:VEVENT')
	}

	lines.push('END:VCALENDAR')

	return `${lines.map((line) => foldLine(line)).join('\r\n')}\r\n`
}
