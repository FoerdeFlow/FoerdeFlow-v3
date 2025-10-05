import z from 'zod'

export default defineEventHandler(async (event) => {
	const query = await getValidatedQuery(event, async (data) => await z.object({
		organizationItem: z.uuid(),
	}).parseAsync(data))

	await checkPermission('sessions.read', { organizationItem: query.organizationItem })

	const database = useDatabase()

	const sessions = await database.query.sessions.findMany({
		where: (sessions, { eq }) => eq(sessions.organizationItem, query.organizationItem),
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

	return sessions
})
