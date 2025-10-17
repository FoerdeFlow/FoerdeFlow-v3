export default defineEventHandler(async (_event) => {
	await checkPermission('workflows.read')

	const database = useDatabase()

	const workflows = await database.query.workflows.findMany()

	return workflows
})
