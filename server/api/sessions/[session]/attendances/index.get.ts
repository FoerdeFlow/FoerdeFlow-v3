import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const database = useDatabase()

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		session: idSchema,
	}).parseAsync(data))

	const session = await database.query.sessions.findFirst({
		where: eq(sessions.id, params.session),
	})

	if(!session) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Sitzung nicht gefunden',
			data: {
				sessionId: params.session,
			},
		})
	}

	const groups = await database.query.organizationItemGroups.findMany({
		where: eq(organizationItemGroups.organizationItem, session.organizationItem),
		with: {
			members: {
				with: {
					organizationItem: {
						with: {
							members: true,
						},
					},
				},
			},
		},
	})

	return {
		session,
		groups,
	}
})
