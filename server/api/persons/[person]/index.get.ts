import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const database = useDatabase()

	const params = await getValidatedRouterParams(event, z.object({
		person: idSchema,
	}).parseAsync)

	const person = await database.query.persons.findFirst({
		where: eq(persons.id, params.person),
	})

	if(!person) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Person nicht gefunden',
			data: {
				personId: params.person,
			},
		})
	}

	return person
})