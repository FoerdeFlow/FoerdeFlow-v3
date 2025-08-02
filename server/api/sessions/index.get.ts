export default defineEventHandler(async (event) => {
	const database = useDatabase()

	const sessions = await database.query.sessions.findMany({
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