import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const query = await getValidatedQuery(event, async (data) => await z.object({
		session: z.uuid(),
	}).parseAsync(data))

	const database = useDatabase()

	const session = await database.query.sessions.findFirst({
		where: eq(sessions.id, query.session),
		with: {
			organizationItem: true,
		},
		columns: {
			organizationItem: false,
		},
	})

	await checkPermission('attendances.read', { organizationItem: session?.organizationItem.id })

	if(!session) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Sitzung nicht gefunden',
			data: {
				sessionId: query.session,
			},
		})
	}

	const sessionMembers = await getSessionMembers(session.id, { isSessionParticipant: true })

	return {
		session,
		groups: sessionMembers.groups
			.map((group) => ({
				id: group.id,
				name: group.groupName,
				members: group.members,
			})),
		guests: sessionMembers.guests,
	}
})
