export default defineEventHandler(async (_event) => {
	await checkPermission('rooms.read')

	const database = useDatabase()

	const rooms = await database.query.rooms.findMany({
		with: {
			building: true,
		},
	})

	return rooms
})
