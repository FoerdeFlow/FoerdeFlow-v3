import { createUpdateSchema } from 'drizzle-zod'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const database = useDatabase()

	const params = await getValidatedRouterParams(event, z.object({
		person: idSchema,
	}).parseAsync)

	const body = await readValidatedBody(event, createUpdateSchema(persons).omit({ id: true }).parseAsync)

	const result = await database
		.update(persons)
		.set(body)
		.where(eq(persons.id, params.person))

	if(result.rowCount === 0) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Person nicht gefunden',
			data: {
				personId: params.person,
			},
		})
	}
})
