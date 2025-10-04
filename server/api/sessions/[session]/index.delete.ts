import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		session: idSchema,
	}).parseAsync(data))

	const database = useDatabase()

	const session = await database.query.sessions.findFirst({
		where: eq(sessions.id, params.session),
		columns: {
			organizationItem: true,
		},
	})

	await checkPermission('sessions.delete', { organizationItem: session?.organizationItem })

	const client = useOpenslides()

	await database.transaction(async (tx) => {
		const [ result = null ] = await tx
			.delete(sessions)
			.where(eq(sessions.id, params.session))
			.returning({ id: sessions.id, organizationItem: sessions.organizationItem })

		if(!result) {
			throw createError({
				statusCode: 404,
				statusMessage: 'Sitzung nicht gefunden',
				data: {
					sessionId: params.session,
				},
			})
		}

		await client.connect()
		const meetingId = await getOpenslidesMeetingId(client, result.organizationItem, result.id)
		await client.meeting.delete({
			id: meetingId,
		})
	})
})
