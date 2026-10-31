import type { EventContext } from '~~/server/types'
import type { H3Event } from 'h3'

/**
 * Returns the person of the user, as only a person can travel.
 *
 * @param event - The request
 * @returns The id of the person of the user
 * @throws When nobody is logged in or the user is no person
 */
export function requireTravelPerson(event: H3Event) {
	const person = (event.context as EventContext).user?.person?.id
	if(!person) {
		throw createError({
			statusCode: 401,
			statusMessage: 'Unauthorized',
			data: 'User is not authenticated',
		})
	}
	return person
}
