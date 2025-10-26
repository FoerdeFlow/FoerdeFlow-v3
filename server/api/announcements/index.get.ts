export default defineEventHandler(async (_event) => {
	await checkPermission('announcements.read')

	const database = useDatabase()

	const announcements = await database.query.announcements.findMany()

	return announcements
})
