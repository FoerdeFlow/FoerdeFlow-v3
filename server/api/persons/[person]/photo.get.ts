import { readFile } from 'node:fs/promises'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { existsSync } from 'node:fs'

export default defineEventHandler(async (event) => {
	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		person: z.uuid(),
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

	// TODO: This is technically not the correct permission
	// However, persons.read would be too broad
	await checkPermission('organizationItems.read')

	if (!existsSync(`./data/${params.person}`)) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Bild nicht gefunden',
		})
	}

	await send(event, await readFile(`./data/${params.person}`))
})
