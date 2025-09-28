export default defineEventHandler((event) => {
	if(!event.context.user) {
		throw createError({
			statusCode: 401,
			statusMessage: 'Unauthorized',
			data: 'User is not authenticated',
		})
	}

	return event.context.user
})
