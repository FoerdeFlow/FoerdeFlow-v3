export default defineEventHandler(async (_event) => {
	await checkPermission('persons.read')

	const database = useDatabase()

	const persons = await database.query.persons.findMany()

	return persons
})
