export default defineEventHandler(async (_event) => {
	await checkPermission('councils.read')

	const database = useDatabase()

	const councils = await database.query.councils.findMany()

	return councils
})
