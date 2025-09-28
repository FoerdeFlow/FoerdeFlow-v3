export default defineEventHandler(async (_event) => {
	await checkPermission('buildings.read')

	const database = useDatabase()

	const buildings = await database.query.buildings.findMany()

	return buildings
})
