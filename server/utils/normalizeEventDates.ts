/**
 * Puts the timestamps of an all-day event onto midnight, so that the convention
 * documented on the events table holds even when the API is called directly and
 * not through the editor.
 *
 * @param body - The event as it was validated, modified in place
 * @returns The same event
 */
export function normalizeEventDates<
	T extends { allDay?: boolean | null, startDate: Date, endDate?: Date | null },
>(body: T): T {
	if(!body.allDay) return body
	body.startDate.setHours(0, 0, 0, 0)
	body.endDate?.setHours(0, 0, 0, 0)
	return body
}
