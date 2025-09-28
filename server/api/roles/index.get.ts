export default defineEventHandler(async (_event) => {
	await checkPermission('roles.read')

	const database = useDatabase()

	const roles = await database.query.roles.findMany()

	return roles
})
