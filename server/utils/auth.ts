import type { EventContext } from '../types'

export function checkPermission(
	permission: string,
	scope: {
		organizationItem?: string
	} = {},
) {
	const event = useEvent()
	const context = event.context as EventContext

	if(!context.user) {
		throw createError({
			statusCode: 401,
			statusMessage: 'Unauthorized',
			data: 'User is not authenticated',
		})
	}

	if(!context.user.permissions.some((item) =>
		item.permission === permission &&
		(item.organizationItem === null || item.organizationItem === scope.organizationItem),
	)) {
		throw createError({
			statusCode: 403,
			statusMessage: 'Forbidden',
			data: 'User does not have the required permission',
		})
	}

	return Promise.resolve()
}
