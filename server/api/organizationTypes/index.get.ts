export default defineEventHandler(async (_event) => {
	await checkPermission('organizationTypes.read')

	const database = useDatabase()

	const organizationTypes = await database.query.organizationTypes.findMany()

	return organizationTypes
})
