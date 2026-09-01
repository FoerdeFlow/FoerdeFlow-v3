import type { H3Event } from 'h3'

const errorsByCode: Record<string, { statusCode: number, statusMessage: string }> = {
	22001: { statusCode: 400, statusMessage: 'Ein Wert ist zu lang' },
	22003: { statusCode: 400, statusMessage: 'Ein Zahlenwert liegt außerhalb des zulässigen Bereichs' },
	'22P02': { statusCode: 400, statusMessage: 'Ein Wert hat ein ungültiges Format' },
	23502: { statusCode: 400, statusMessage: 'Ein erforderlicher Wert fehlt' },
	23503: { statusCode: 400, statusMessage: 'Ein referenzierter Datensatz existiert nicht' },
	23505: { statusCode: 409, statusMessage: 'Ein Datensatz mit diesen Werten existiert bereits' },
	23514: { statusCode: 400, statusMessage: 'Die Eingabe verletzt eine fachliche Regel' },
}

interface DatabaseError {
	code: string
	constraint?: string
	table?: string
	column?: string
}

function findDatabaseError(error: unknown) {
	let current = error

	for(let depth = 0; current && depth < 5; depth++) {
		if(
			typeof current === 'object' &&
			'code' in current &&
			typeof current.code === 'string' &&
			current.code in errorsByCode
		) {
			return current as unknown as DatabaseError
		}

		current = typeof current === 'object' && 'cause' in current
			? current.cause
			: undefined
	}

	return null
}

export default function(
	error: {
		statusCode?: number
		statusMessage?: string
		data?: unknown
		unhandled?: boolean
		fatal?: boolean
	},
	event: H3Event,
) {
	if(error.statusCode && error.statusCode !== 500) {
		return
	}

	const databaseError = findDatabaseError(error)
	const mappedError = databaseError && errorsByCode[databaseError.code]
	if(!databaseError || !mappedError) {
		return
	}

	const { statusCode, statusMessage } = databaseError.code === '23503' && event.method === 'DELETE'
		? { statusCode: 409, statusMessage: 'Der Datensatz wird noch verwendet' }
		: mappedError

	error.statusCode = statusCode
	error.statusMessage = statusMessage
	error.data = {
		constraint: databaseError.constraint,
		table: databaseError.table,
		column: databaseError.column,
	}

	error.unhandled = false
	error.fatal = false
}
