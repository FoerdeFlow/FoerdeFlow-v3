export default defineEventHandler(async (_event) => {
	await checkPermission('calendarTokens.read')

	const database = useDatabase()

	return await database.query.calendarTokens.findMany({
		with: {
			kinds: {
				with: { eventType: true },
				columns: { eventType: false },
			},
			organizationItems: {
				with: { organizationItem: true },
				columns: { organizationItem: false },
			},
		},
		orderBy: (calendarTokens, { asc }) => [ asc(calendarTokens.createdAt) ],
	})
})
