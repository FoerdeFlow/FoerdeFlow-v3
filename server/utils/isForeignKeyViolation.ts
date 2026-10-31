/**
 * Tells whether a database error, or one of its causes, is the violation of a
 * foreign key, as raised when a row that is still referenced is deleted.
 *
 * @param error - The error thrown by the query
 * @returns Whether Postgres refused the query with code 23503
 */
export function isForeignKeyViolation(error: unknown) {
	let current = error

	for(let depth = 0; current && depth < 5; depth++) {
		if(typeof current === 'object' && 'code' in current && current.code === '23503') {
			return true
		}

		current = typeof current === 'object' && 'cause' in current
			? current.cause
			: undefined
	}

	return false
}
