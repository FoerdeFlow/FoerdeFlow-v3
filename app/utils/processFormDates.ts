/** The fields of a form model that hold a date instead of a plain value. */
export const processFormDateFields = [ 'startDate', 'endDate' ]

/**
 * Turns a serialized date back into a `Date`, so that the date inputs of the
 * forms can work with it.
 *
 * @param field - The field the value belongs to
 * @param value - The value as it was read from JSON
 * @returns A `Date` for a date field, the value unchanged otherwise
 */
export function reviveFormDate(field: string, value: unknown): unknown {
	return processFormDateFields.includes(field) && typeof value === 'string'
		? new Date(value)
		: value
}
