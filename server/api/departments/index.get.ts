export default defineEventHandler(async (_event) => {
	await checkPermission('departments.read')

	const database = useDatabase()

	const departments = await database.query.departments.findMany()

	return departments
})
