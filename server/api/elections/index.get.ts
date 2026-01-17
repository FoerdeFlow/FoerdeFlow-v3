export default defineEventHandler(async (_event) => {
	await checkPermission('elections.read')

	const database = useDatabase()

	const elections = await database.query.elections.findMany()

	return elections
})
