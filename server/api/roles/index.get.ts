export default defineEventHandler(async (_event) => {
	const database = useDatabase()

	const roles = await database.query.roles.findMany()

	return roles
})
