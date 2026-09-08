import type { EventContext } from '../types'
import type { Permission } from './permissions'

/**
 * Checks a permission without refusing the request, for the places that hand
 * out a part of a response only to those who may see it.
 *
 * `checkPermission` throws rather than rejecting, so it cannot be caught with
 * `.catch()` the way the asynchronous permission checks can.
 *
 * @param permission - The permission to look for
 * @param scope - The scope the permission has to cover
 * @param options - The options of the check
 * @returns Whether the current user has the permission
 */
export function hasPermission(
	permission: Permission,
	scope: {
		organizationItem?: string
	} = {},
	options: {
		exactScopeMatch?: boolean
	} = {},
) {
	try {
		// The result is a resolved promise, the refusal is thrown right away.
		checkPermission(permission, scope, options).catch(() => { /**/ })
		return true
	} catch(_error) {
		return false
	}
}

export function checkPermission(
	permission: Permission,
	scope: {
		organizationItem?: string
	} = {},
	options: {
		exactScopeMatch?: boolean
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

	if(context.user.roles.some((role) => role.isAdmin)) {
		return Promise.resolve()
	}

	if(!context.user.permissions.some((item) =>
		item.permission === permission &&
		(
			item.organizationItem === false ||
			(!options.exactScopeMatch && item.organizationItem === null) ||
			item.organizationItem === scope.organizationItem
		),
	)) {
		throw createError({
			statusCode: 403,
			statusMessage: 'Forbidden',
			data: 'User does not have the required permission',
		})
	}

	return Promise.resolve()
}
