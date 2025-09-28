export function checkPermission(permission: string) {
	const event = useEvent()
	if(!event.context.user) {
		throw createError({
			statusCode: 401,
			statusMessage: 'Unauthorized',
			data: 'User is not authenticated',
		})
	}
	if(!event.context.user.permissions.includes(permission)) {
		throw createError({
			statusCode: 403,
			statusMessage: 'Forbidden',
			data: 'User does not have the required permission',
		})
	}
}
