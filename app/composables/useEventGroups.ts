import type { MaybeRefOrGetter } from 'vue'

const millisecondsPerDay = 24 * 60 * 60 * 1000

const dayMonthFormatter = new Intl.DateTimeFormat('de-DE', {
	day: '2-digit',
	month: '2-digit',
	timeZone: 'UTC',
})

const relativeWeeks: Record<number, string> = {
	[-1]: 'Letzte Woche',
	0: 'Diese Woche',
	1: 'Nächste Woche',
}

/**
 * Names a calendar week with its number and its days, and, for the weeks around
 * the current one, also relative to today.
 */
function formatWeek(week: ReturnType<typeof getIsoWeek>, currentMonday: number) {
	const day = (dayNumber: number) => new Date(dayNumber * millisecondsPerDay)
	const mondayYear = day(week.monday).getUTCFullYear()
	const sundayYear = day(week.sunday).getUTCFullYear()
	// Über den Jahreswechsel trägt jeder der beiden Tage sein Jahr.
	const days = `${dayMonthFormatter.format(day(week.monday))}${mondayYear === sundayYear ? '' : mondayYear}–` +
		`${dayMonthFormatter.format(day(week.sunday))}${sundayYear}`
	const relative = relativeWeeks[(week.monday - currentMonday) / 7]
	return [ relative, `KW ${week.week}`, days ].filter(Boolean).join(' · ')
}

/**
 * Splits events into the current and the past ones, each with groups for
 * `KernTable`. The current ones start with those running now, followed by the
 * upcoming ones by calendar week, the earliest first; the past ones are grouped
 * by calendar week as well, the most recent first.
 *
 * @param events - The events to group
 * @returns The current and the past events, each in order and with their groups
 */
export function useEventGroups<T extends EventDates>(events: MaybeRefOrGetter<T[] | null | undefined>) {
	return computed(() => {
		const now = new Date()
		const currentMonday = getIsoWeek(getDayNumber(now)).monday
		const time = (event: T) => new Date(event.startDate).getTime()

		const status = new Map((toValue(events) ?? []).map((event) => [ event, getEventStatus(event, now) ]))
		const withStatus = (wanted: EventStatus) =>
			[ ...status ].filter(([ , value ]) => value === wanted).map(([ event ]) => event)

		const running = withStatus('running').sort((a, b) => time(a) - time(b))
		const upcoming = withStatus('upcoming').sort((a, b) => time(a) - time(b))
		const past = withStatus('past').sort((a, b) => time(b) - time(a))

		// Die Termine sind bereits sortiert, die Wochen entstehen also in derselben
		// Reihenfolge.
		const byWeek = (list: T[], muted: boolean) => {
			const groupOf = new Map<T, number>()
			const weeks = new Map<number, ReturnType<typeof getIsoWeek> & { count: number }>()
			for(const event of list) {
				const week = getIsoWeek(getDayNumber(event.startDate))
				groupOf.set(event, week.monday)
				const entry = weeks.get(week.monday) ?? { ...week, count: 0 }
				entry.count++
				weeks.set(week.monday, entry)
			}
			return [ ...weeks.values() ].map((week) => ({
				key: `week-${week.monday}`,
				label: `${formatWeek(week, currentMonday)} (${week.count})`,
				includes: (event: T) => groupOf.get(event) === week.monday,
				muted,
			}))
		}

		return {
			current: {
				items: [ ...running, ...upcoming ],
				groups: [
					{
						key: 'running',
						label: `Aktuell (${running.length})`,
						includes: (event: T) => status.get(event) === 'running',
						muted: false,
					},
					...byWeek(upcoming, false),
				],
			},
			past: {
				items: past,
				groups: byWeek(past, true),
			},
		}
	})
}
