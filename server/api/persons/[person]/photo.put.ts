import { writeFile } from 'node:fs/promises'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		person: idSchema,
	}).parseAsync(data))

	const body = await readRawBody(event, false)
	if (!body || body.length === 0) {
		throw createError({
			statusCode: 400,
			statusMessage: 'Bad Request',
			data: 'Image body is empty',
		})
	}

	const database = useDatabase()

	const person = await database.query.persons.findFirst({
		where: eq(persons.id, params.person),
		columns: {
			id: true,
		},
	})

	if (!person) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Person nicht gefunden',
			data: {
				personId: params.person,
			},
		})
	}

	await checkPermission('persons.update')

	await writeFile(`./data/${params.person}`, body)
})
