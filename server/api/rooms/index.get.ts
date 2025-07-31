export default defineEventHandler(async (event) => {
	const database = useDatabase()

	const rooms = await database.query.rooms.findMany({
		with: {
			building: true,
		},
	})

	return rooms
})