import { unlink } from 'node:fs/promises'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		person: idSchema,
	}).parseAsync(data))

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

	try {
		await unlink(`./data/${params.person}`)
	} catch (_error) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Bild nicht gefunden',
		})
	}
})
