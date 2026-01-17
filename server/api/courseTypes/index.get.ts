export default defineEventHandler(async (_event) => {
	await checkPermission('courseTypes.read')

	const database = useDatabase()

	const courseTypes = await database.query.courseTypes.findMany()

	return courseTypes
})
