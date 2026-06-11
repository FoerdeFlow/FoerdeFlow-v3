import { count } from 'drizzle-orm'
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

	const personsCount = await database.select({ count: count() }).from(persons)

	const personsList = await database.query.persons.findMany({
		where: (persons, { and, or, eq, ilike, sql }) => and(
			...(query.email ? [ eq(persons.email, query.email ?? '') ] : []),
			...(query.query
				? [ or(
					ilike(persons.firstName, `%${query.query}%`),
					ilike(persons.callName, `%${query.query}%`),
					ilike(persons.lastName, `%${query.query}%`),
					ilike(sql`${persons.firstName} || ' ' || ${persons.lastName}`, `%${query.query}%`),
					ilike(sql`${persons.callName} || ' ' || ${persons.lastName}`, `%${query.query}%`),
					ilike(sql`${persons.lastName} || ', ' || ${persons.firstName}`, `%${query.query}%`),
					ilike(sql`${persons.lastName} || ', ' || ${persons.callName}`, `%${query.query}%`),
					ilike(persons.email, `%${query.query}%`),
				) ]
				: []),
		),
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
			...person,
			hasPhoto: existsSync(`./data/${person.id}`),
		})),
	}
})
