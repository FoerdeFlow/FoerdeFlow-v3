export default defineEventHandler(async (event) => {
	const database = useDatabase()

	const organizationTypes = await database.query.organizationTypes.findMany()

	return organizationTypes
})