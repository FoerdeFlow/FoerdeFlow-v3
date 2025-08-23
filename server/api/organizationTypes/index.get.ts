export default defineEventHandler(async (_event) => {
	const database = useDatabase()

	const organizationTypes = await database.query.organizationTypes.findMany()

	return organizationTypes
})
