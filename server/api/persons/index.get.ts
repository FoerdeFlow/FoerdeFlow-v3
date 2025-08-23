export default defineEventHandler(async (_event) => {
	const database = useDatabase()

	const persons = await database.query.persons.findMany()

	return persons
})
