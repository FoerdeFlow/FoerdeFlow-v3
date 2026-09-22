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
			location: {
				with: {
					parent: true,
				},
				columns: {
					parent: false,
				},
			},
			onlineLocation: {
				with: {
					parent: true,
				},
				columns: {
					parent: false,
				},
			},
		},
		columns: {
			organizationItem: false,
			location: false,
			onlineLocation: false,
		},
		orderBy: (sessions, { asc }) => [
			asc(sessions.plannedDate),
		],
	})

	return sessions
})
