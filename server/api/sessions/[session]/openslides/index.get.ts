import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const database = useDatabase()

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		session: idSchema,
	}).parseAsync(data))

	const session = await database.query.sessions.findFirst({
		where: eq(sessions.id, params.session),
		columns: {
			id: true,
			organizationItem: true,
		},
	})

	await checkPermission('sessions.read', { organizationItem: session?.organizationItem })

	if(!session) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Sitzung nicht gefunden',
			data: {
				sessionId: params.session,
			},
		})
	}

	const runtimeConfig = useRuntimeConfig()
	const client = useOpenslides()
	await client.connect()
	const openslidesSessionId = await getOpenslidesMeetingId(client, session.organizationItem, session.id)
	await sendRedirect(event, `${runtimeConfig.openslides.server}/${openslidesSessionId}`)
})
