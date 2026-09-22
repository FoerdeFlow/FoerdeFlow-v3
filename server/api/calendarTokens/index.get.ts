export default defineEventHandler(async (_event) => {
	await checkPermission('calendarTokens.read')

	const database = useDatabase()

	return await database.query.calendarTokens.findMany({
		orderBy: (calendarTokens, { asc }) => [ asc(calendarTokens.createdAt) ],
	})
})
