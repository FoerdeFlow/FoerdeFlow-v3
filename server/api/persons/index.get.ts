export default defineEventHandler(async (event) => {
	const database = useDatabase()

	const persons = await database.query.persons.findMany()

	return persons
})