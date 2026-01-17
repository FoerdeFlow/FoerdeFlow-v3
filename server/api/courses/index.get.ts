export default defineEventHandler(async (_event) => {
	await checkPermission('courses.read')

	const database = useDatabase()

	const courses = await database.query.courses.findMany({
		with: {
			type: true,
			department: true,
			council: true,
		},
		columns: {
			type: false,
			department: false,
			council: false,
		},
	})

	return courses
})
