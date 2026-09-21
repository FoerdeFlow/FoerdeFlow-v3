export default defineEventHandler(async (_event) => {
	await checkPermission('eventTypes.read')

	const database = useDatabase()

	const eventTypes = await database.query.eventTypes.findMany()

	return eventTypes
})
