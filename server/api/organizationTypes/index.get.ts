export default defineEventHandler(async (_event) => {
	await checkPermission('organizationTypes.read')

	const database = useDatabase()

	const organizationTypes = await database.query.organizationTypes.findMany({
		orderBy: (organizationTypes, { asc }) => [
			asc(organizationTypes.sortOrder),
			asc(organizationTypes.name),
		],
	})

	return organizationTypes
})
