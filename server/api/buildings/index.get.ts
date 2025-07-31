export default defineEventHandler(async (event) => {
	const database = useDatabase()

	const buildings = await database.query.buildings.findMany()

	return buildings
})