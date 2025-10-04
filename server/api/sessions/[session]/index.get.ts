import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const database = useDatabase()

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		session: idSchema,
	}).parseAsync(data))

	const session = await database.query.sessions.findFirst({
		where: eq(sessions.id, params.session),
		with: {
			organizationItem: true,
			room: {
				with: {
					building: true,
				},
				columns: {
					building: false,
				},
			},
		},
		columns: {
			organizationItem: false,
			room: false,
		},
	})

	await checkPermission('sessions.read', { organizationItem: session?.organizationItem.id })

	if(!session) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Sitzung nicht gefunden',
			data: {
				sessionId: params.session,
			},
		})
	}

	return session
})
