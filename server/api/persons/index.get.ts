import z from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('persons.read')

	const query = await getValidatedQuery(event, async (data) => await z.strictObject({
		email: z.email().optional(),
	}).parseAsync(data))

	const database = useDatabase()

	const persons = await database.query.persons.findMany({
		...(query.email
			? {
				where: (persons, { eq }) => eq(persons.email, query.email ?? ''),
			}
			: {}),
		with: {
			course: true,
		},
		columns: {
			course: false,
		},
		orderBy: (persons, { asc }) => [
			asc(persons.lastName),
			asc(persons.firstName),
			asc(persons.email),
		],
	})

	return persons
})
