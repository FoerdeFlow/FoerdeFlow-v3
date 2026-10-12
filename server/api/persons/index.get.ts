import { and, count, eq, ilike, or } from 'drizzle-orm'
import { existsSync } from 'node:fs'
import z from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('persons.read')

	const query = await getValidatedQuery(event, async (data) => await z.strictObject({
		email: z.email().optional(),
		page: z.coerce.number().int().min(0).optional(),
		query: z.string().optional(),
		limit: z.coerce.number().int().min(1).max(10).default(10),
	}).parseAsync(data))

	const database = useDatabase()

	const filter = and(
		...(query.email ? [ eq(persons.email, query.email) ] : []),
		// Every word has to appear in one of the fields, wherever it stands, so
		// that a middle name kept in `firstName` need not be typed along.
		...(query.query?.split(/[\s,]+/).filter(Boolean) ?? []).map((word) => or(
			ilike(persons.firstName, `%${word}%`),
			ilike(persons.callName, `%${word}%`),
			ilike(persons.lastName, `%${word}%`),
			ilike(persons.email, `%${word}%`),
		)),
	)

	const personsCount = await database
		.select({ count: count() })
		.from(persons)
		.where(filter)

	const personsList = await database.query.persons.findMany({
		where: filter,
		with: {
			course: true,
		},
		columns: {
			id: true,
			email: true,
			firstName: true,
			lastName: true,
			callName: true,
			gender: true,
			pronouns: true,
		},
		orderBy: (persons, { asc }) => [
			asc(persons.lastName),
			asc(persons.firstName),
			asc(persons.email),
		],
		limit: query.limit,
		offset: (query.page ?? 0) * query.limit,
	})

	return {
		count: personsCount[0]?.count ?? 0,
		items: personsList.map((person) => ({
			...withDisplayName(person),
			hasPhoto: existsSync(`./data/${person.id}`),
		})),
	}
})
