import z from 'zod'

export default defineEventHandler(async (event) => {
	const database = useDatabase()

	const query = await getValidatedQuery(event, async (data) => await z.object({
		organizationItem: z.uuid(),
	}).parseAsync(data))

	const sessions = await database.query.sessions.findMany({
		where: (sessions, { eq }) => eq(sessions.organizationItem, query.organizationItem),
		with: {
			organizationItem: true,
			room: {
				with: {
					building: true,
				},
			},
		},
	})

	return sessions
})
