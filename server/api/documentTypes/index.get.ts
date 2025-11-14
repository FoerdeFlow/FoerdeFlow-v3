export default defineEventHandler(async (_event) => {
	await checkPermission('documentTypes.read')

	const database = useDatabase()

	const documentTypes = await database.query.documentTypes.findMany()

	return documentTypes
})
