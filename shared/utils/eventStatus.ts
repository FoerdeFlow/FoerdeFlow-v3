export type EventStatus = 'running' | 'upcoming' | 'past'

export interface EventDates {
	startDate: string | Date
	endDate?: string | Date | null
	allDay?: boolean | null
}

const millisecondsPerDay = 24 * 60 * 60 * 1000

const dayFormatter = new Intl.DateTimeFormat('en-CA', {
	year: 'numeric',
	month: '2-digit',
	day: '2-digit',
	timeZone: 'Europe/Berlin',
})

/**
 * Counts the days since 1 January 1970 up to the calendar day a point in time
 * falls on in Berlin. Counting days rather than comparing times keeps day
 * boundaries and the change to and from summer time out of the comparisons.
 *
 * @param date - The point in time, or a day as `YYYY-MM-DD`
 * @returns The number of the day
 */
export function getDayNumber(date: string | Date): number {
	const day = typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)
		? date
		: dayFormatter.format(new Date(date))
	const [ year = 1970, month = 1, dayOfMonth = 1 ] = day.split('-').map(Number)
	return Date.UTC(year, month - 1, dayOfMonth) / millisecondsPerDay
}

/**
 * The calendar week a day belongs to, after ISO 8601: weeks start on Monday,
 * and the first week of a year is the one holding its first Thursday.
 *
 * @param dayNumber - The day, as counted by `getDayNumber`
 * @returns The year and number of the week, and the days it starts and ends on
 */
export function getIsoWeek(dayNumber: number) {
	// Der 1. Januar 1970 war ein Donnerstag.
	const monday = dayNumber - (dayNumber + 3) % 7
	const thursday = monday + 3
	const year = new Date(thursday * millisecondsPerDay).getUTCFullYear()
	const week = Math.floor((thursday - Date.UTC(year, 0, 1) / millisecondsPerDay) / 7) + 1
	return { year, week, monday, sunday: monday + 6 }
}

/**
 * The days an event touches, from the day it starts to the day it ends on. An
 * all-day event ends on its last day, inclusive; an event without an end only
 * takes up the day it starts on.
 *
 * @param event - The dates of the event
 * @returns The first and the last day, as counted by `getDayNumber`
 */
export function getEventDays(event: EventDates) {
	const first = getDayNumber(event.startDate)
	return { first, last: event.endDate ? getDayNumber(event.endDate) : first }
}

/**
 * The state of an event at a point in time. An all-day event and an event
 * without an end count as running for the whole of their days, so that a
 * session that began a few minutes ago does not yet drop into the past.
 *
 * @param event - The dates of the event
 * @param now - The point in time to look at
 * @returns Whether the event has yet to start, runs or is over
 */
export function getEventStatus(event: EventDates, now = new Date()): EventStatus {
	if(new Date(event.startDate) > now) return 'upcoming'
	if(!event.allDay && event.endDate) {
		return new Date(event.endDate) > now ? 'running' : 'past'
	}
	return getEventDays(event).last >= getDayNumber(now) ? 'running' : 'past'
}
