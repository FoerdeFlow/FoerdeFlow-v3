export default defineEventHandler(async (_event) => {
	const database = useDatabase()

	const buildings = await database.query.buildings.findMany()

	return buildings
})
